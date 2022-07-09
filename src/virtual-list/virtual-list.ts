import { Component } from "../utils/component";
import { intersectionObserver } from "../utils/observer.utils";

type Props<T> = {
  itemMargin: number;
  pageSize: number;
  load: (start: number, limit: number) => Promise<T[]>;
  templateFn: (item: T) => string;
  updateItemFn: (element: HTMLElement, datum: T) => HTMLElement;
};

type State = {
  start: number;
  end: number;
};

const enum ScrollDirection {
  UP = "up",
  DOWN = "down",
}

export class VirtualListComponent<T> extends Component<Props<T>, State> {
  TOP_OBSERVER_ELEMENT: HTMLElement;
  BOTTOM_OBSERVER_ELEMENT: HTMLElement;
  ELEMENTS_LIMIT = this.props.pageSize * 2;
  ELEMENTS_POOL: HTMLElement[] = [];
  state = {
    start: 0,
    end: 0,
  };

  init(): void {
    const [topObserver] = intersectionObserver(
      this.root,
      async ([entry]) => {
        if (entry.intersectionRatio > 0.1) {
          await this.update(ScrollDirection.UP);
        }
      },
      undefined,
      { className: "virtual-top-observer absolute-center" }
    );
    const [bottomObserver] = intersectionObserver(
      this.root,
      async ([entry]) => {
        if (entry.intersectionRatio > 0.1) {
          await this.update(ScrollDirection.DOWN);
        }
      },
      undefined,
      { className: "virtual-bottom-observer absolute-center" }
    );
    this.TOP_OBSERVER_ELEMENT = topObserver;
    this.BOTTOM_OBSERVER_ELEMENT = bottomObserver;
    this.element.style.paddingTop = "0px";
    this.element.style.paddingBottom = "0px";
  }

  getComponentId(): string {
    return "virtual-list";
  }

  async update(trigger: ScrollDirection) {
    switch (trigger) {
      case ScrollDirection.UP:
        await this.#handleTopIntersection();
        break;
      case ScrollDirection.DOWN:
        await this.#handleBottomIntersection();
        break;
    }
  }

  #recycle(direction: ScrollDirection, chunk: T[]) {
    const { pageSize } = this.props;
    if (direction === ScrollDirection.DOWN) {
      // Get the last element from the pool to determine the right position
      let lastCurrentElement =
        this.ELEMENTS_POOL[this.ELEMENTS_POOL.length - 1];
      let lastCurrentElementY =
        +lastCurrentElement.dataset.translateY +
        lastCurrentElement.getBoundingClientRect().height +
        this.props.itemMargin;
      // Select first props.pageSize items from buffer zone
      for (let i = 0; i < pageSize; i++) {
        const element = this.ELEMENTS_POOL[i];
        // Update ordering attribute
        element.dataset.virtuaListOrder = `${this.state.start + pageSize + i}`;
        // Update the item content
        this.props.updateItemFn(element, chunk[i]);
        // Update the item position
        element.style.transform = `translateY(${lastCurrentElementY}px)`;
        // Store it for easy access in the next iteration
        element.dataset.translateY = `${lastCurrentElementY}`;
        // Update last element reference and position
        lastCurrentElement = element;
        lastCurrentElementY =
          +lastCurrentElement.dataset.translateY +
          lastCurrentElement.getBoundingClientRect().height +
          this.props.itemMargin;
      }
    } else {
      // Get the first element from the pool to determine the right position
      let firstCurrentElement = this.ELEMENTS_POOL[0];
      // Select last props.pageSize items from buffer zone
      for (let i = this.ELEMENTS_LIMIT - 1; i >= pageSize; i--) {
        const element = this.ELEMENTS_POOL[i];
        // Update ordering attribute
        element.dataset.virtuaListOrder = `${
          this.state.start + (i - pageSize)
        }`;
        // Update the item content
        this.props.updateItemFn(element, chunk[i - pageSize]);
        // Update the item position
        const nextFirstPositionY =
          +firstCurrentElement.dataset.translateY -
          this.props.itemMargin -
          element.getBoundingClientRect().height;
        element.style.transform = `translateY(${nextFirstPositionY}px)`;
        // Store it for easy access in the next iteration
        element.dataset.translateY = `${nextFirstPositionY}`;
        // Update last element reference and position
        firstCurrentElement = element;
      }
    }
    // Sort pool accroding to elements order
    this.ELEMENTS_POOL = this.ELEMENTS_POOL.sort((a, b) => {
      return +a.dataset.virtuaListOrder - +b.dataset.virtuaListOrder;
    });
  }

  #handleTopIntersection = async () => {
    // Move top and bottom observers
    if (this.state.start > 0) {
      const { pageSize } = this.props;
      const data = await this.props.load(this.state.start - pageSize, pageSize);
      // Update start and end position
      this.state.start -= this.props.pageSize;
      this.state.end -= this.props.pageSize;
      // Trigger recycling
      this.#recycle(ScrollDirection.UP, data);
      // Get the current first element Y Position
      const firstElementTranslateY = this.ELEMENTS_POOL[0].dataset.translateY;
      // The diff between old and new first element position is the value
      // that we need to substract from the bottom spacer
      const diff =
        +firstElementTranslateY -
        +this.element.style.paddingTop.replace("px", "");
      this.element.style.paddingBottom = `${Math.max(
        0,
        +this.element.style.paddingBottom.replace("px", "") - diff
      )}px`;
      this.element.style.paddingTop = `${firstElementTranslateY}px`;
      // Move observers to 1st and last rendered item respectively
      this.TOP_OBSERVER_ELEMENT.style.transform = `translateY(${firstElementTranslateY}px)`;
      this.BOTTOM_OBSERVER_ELEMENT.style.transform = `translateY(${
        this.ELEMENTS_POOL[this.ELEMENTS_POOL.length - 1].dataset.translateY
      }px)`;
    }
  };

  #handleBottomIntersection = async () => {
    const { pageSize } = this.props;
    const count = this.state.end - this.state.start;
    const data = await this.props.load(this.state.end, pageSize);
    if (count < this.ELEMENTS_LIMIT) {
      this.state.end += this.props.pageSize;
      this.#initElementsPool(data);
    } else if (count === this.ELEMENTS_LIMIT) {
      // Update start and end position
      this.state.start += this.props.pageSize;
      this.state.end += this.props.pageSize;
      // Trigger recycling
      this.#recycle(ScrollDirection.DOWN, data);
      // Get the current first element Y Position
      const firstElementTranslateY = +this.ELEMENTS_POOL[0].dataset.translateY;
      // Calculate how much space we need to adjust
      const diff =
        firstElementTranslateY -
        +this.element.style.paddingTop.replace("px", "");
      // Padding top always equals to Y position of first rendered element
      this.element.style.paddingTop = `${firstElementTranslateY}px`;
      // The diff between old and new first element position is the value
      // that we need to substract from the bottom spacer
      this.element.style.paddingBottom = `${Math.max(
        0,
        +this.element.style.paddingBottom.replace("px", "") - diff
      )}px`;
      this.TOP_OBSERVER_ELEMENT.style.transform = `translateY(${firstElementTranslateY}px)`;
    }
    this.BOTTOM_OBSERVER_ELEMENT.style.transform = `translateY(${
      this.ELEMENTS_POOL[this.ELEMENTS_POOL.length - 1].dataset.translateY
    }px)`;
  };

  #initElementsPool(chunk: T[]): void {
    const elements = chunk.map((d, i) => {
      const element = document.createElement("div");
      element.innerHTML = this.props.templateFn(d);
      const itemElement = element.firstElementChild as HTMLElement;
      // Add absolute positioning to each list item
      itemElement.classList.add("absolute-center");
      // Set up virtual list order attribute
      itemElement.dataset.virtuaListOrder = `${this.ELEMENTS_POOL.length + i}`;
      // Initialialize translateY attribute
      itemElement.dataset.translateY = `${0}`;
      return element.firstElementChild as HTMLElement;
    });
    this.ELEMENTS_POOL.push(...elements);
    this.element.append(...elements);
    for (const element of elements) {
      if (element.previousSibling !== null) {
        // Getting the previous element if exists
        const sublingElement = element.previousElementSibling as HTMLElement;
        // Getting the previous element height
        const siblingHeight = sublingElement.getBoundingClientRect().height;
        // Getting the previous element translateY
        const sublingTranslateY = +sublingElement.dataset.translateY;
        // Calculating the position of current element
        const translateY =
          siblingHeight + sublingTranslateY + this.props.itemMargin;
        // Moving element
        element.style.transform = `translateY(${translateY}px)`;
        // Store the position in data attribute
        element.dataset.translateY = `${translateY}`;
      }
    }
  }

  #genList = (items: T[]) => items.map(this.props.templateFn).join("").trim();
}
