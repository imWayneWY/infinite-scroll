import { Component } from "../utils/component"

type Props<T> = {
	load: () => Promise<T[]>,
	templateFn: (item: T) => string
}

export class ListComponent<T> extends Component<Props<T>> {
	update(items: T[]) {
		const content = this.#genList(items);
		this.element.insertAdjacentHTML('beforeend', content);
	}
	#genList = (items: T[]) => items.map(this.props.templateFn).join('').trim();
	effect(): void {
		this.props.load().then(data => this.update(data));
	}
	getComponentId(): string {
		return "feed";
	}
}
