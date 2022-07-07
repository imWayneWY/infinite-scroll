import { Component } from "../utils/component";
import { intersectionObserver } from "../utils/observer.utils";

type Props<T> = {
	pageSize: number,
	load: (start: number, limit: number) => Promise<T[]>,
	templateFn: (item: T) => string;
}

type State = {
	end: number;
};

export class LazyListComponent<T> extends Component<Props<T>, State> {
	state = {
		end: 0
	}
	update(items: T[]) {
		this.state.end += this.props.pageSize;
		const content = this.#genList(items);
		this.element.insertAdjacentHTML("beforeend", content);
	}
	getComponentId(): string {
		return "feed";
	}
	#genList = (items: T[]) => items.map(this.props.templateFn).join("").trim();

	init(): void {
		intersectionObserver(this.root, async ([entry]) => {
			if (entry.intersectionRatio > 0.1) {
				const { end } = this.state;
				const data = await this.props.load(end, this.props.pageSize);
				this.update(data);
			}
		})
	}
}
