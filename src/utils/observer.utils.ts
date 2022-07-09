type TElementConfig = {
	className?: string;
	insertPosition?: InsertPosition;
	tag?: string;
};

const defaultElementConfig: TElementConfig = {
	insertPosition: "beforeend",
	tag: "div"
};

const defaultObserverConfig: IntersectionObserverInit = { threshold: 0.25 };

/**
 * @param root - Root element where we want to insert the newly created element
 * @param callback - callback function that is called when the viewpoint is intersected with element
 * @param observerConfig - {@link IntersectionObserverInit} - init config for Intersection Observer
 * @param elementConfig - utility attributes for HTMLElement
 */
export function intersectionObserver(
	root: HTMLElement,
	callback: IntersectionObserverCallback,
	observerConfig?: IntersectionObserverInit,
	elementConfig?: TElementConfig
): [HTMLElement, IntersectionObserver] {
	// initialize config objects
	const { insertPosition, className, tag } = Object.assign(
		elementConfig ?? {},
		defaultElementConfig
	);
	observerConfig = Object.assign(observerConfig ?? {}, defaultObserverConfig);
	const observer = new IntersectionObserver(callback, observerConfig); // init observer
	const element = document.createElement(tag); // Create a target element
	element.classList.add("intersection-observer", ...(className).split(" ")); // Add utility classname to the target element
	root.insertAdjacentElement(insertPosition, element); // Insert the target element into DOM
	observer.observe(element); // Observer intersection of target element with viewpoint
	return [element, observer]; // Return target element and observer object
}
