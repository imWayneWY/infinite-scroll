import { Component } from "../utils/component";
import { intersectionObserver } from "../utils/observer.utils";

type Props<T> = {
	pageSize: number;
	load: (start: number, limit: number) => Promise<T[]>;
	templateFn: (item: T) => string;
	updateItemFn: (element: HTMLElement, datum: T) => HTMLElement;
}

type State = {
	start: number;
	end: number;
};

const enum ScrollDirection {
	UP = "up",
	DOWN = "down"
}

export class VirtualListComponent<T> extends Component<Props<T>, State> {
	TOP_OBSERVER_ELEMENT: HTMLElement = null;
	BOTTOM_OBSERVER_ELEMENT: HTMLElement = null;
	ELEMENTS_LIMIT = this.props.pageSize * 2;
	ELEMENTS_POOL = [];
	state = {
		start: 0,
		end: 0
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
			{ className: "top-observer" }
		);
		const [bottomObserver] = intersectionObserver(
			this.root,
			async ([entry]) => {
				if (entry.intersectionRatio > 0.1) {
					await this.update(ScrollDirection.DOWN);
				}
			},
			undefined,
			{ className: "bottom-observer" }
		);
		this.TOP_OBSERVER_ELEMENT = topObserver;
		this.BOTTOM_OBSERVER_ELEMENT = bottomObserver;
	};

	getComponentId(): string {
		return "feed";
	}
	#genList = (items: T[]) => items.map(this.props.templateFn).join("").trim();

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

	#handleBottomIntersection = async () => {
		const { pageSize } = this.props;
		// number of elements rendered
		const count = this.state.end - this.state.start;
		const data = await this.props.load(this.state.end, pageSize);
		// Handling the case when element limit has not been reached yet
		if (count < this.ELEMENTS_LIMIT) {
			this.#initElementsPool(data);
			this.state.end += this.props.pageSize;
		} else if (count === this.ELEMENTS_LIMIT) {
			// todo: add logic here
		}
	};
	#handleTopIntersection = async() => {};

	#initElementsPool(chunk: T[]): void {
		// Create HTMLElement for each piece of data T
		const elements = chunk.map((d) => {
			const element = document.createElement("div");
			element.innerHTML = this.props.templateFn(d);
			return element.firstElementChild;
		});
		// save references to these elements into the pool
		this.ELEMENTS_POOL.push(...elements);
		// Render each element at the bottom of the list
		for (const el of elements) {
			this.root.insertBefore(
				el,
				/**
				 * BOTTOM_OBSERVER_ELEMENT can be not initialized due to the callback is set up
				 * before variable is assigned
				 */
				this.BOTTOM_OBSERVER_ELEMENT ??
					document.querySelector(".bottom-observer")
			);
		}
	}
}