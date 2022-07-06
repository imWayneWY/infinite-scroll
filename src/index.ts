import { FeedItem, getItem } from "./utils/data.utils";

const template = ({ name, description, url }: FeedItem) => {
	return `<section class="feed__item">
	<img
		class="feed__item__img"
		alt="Avatar for logo"
		src=${url}
	/>
	<div class="feed__item__description">
		<h2 class="h2-header">${name}</h2>
		<p class="p-text">
			${description}
		</p>
	</div>
</section>`
}

const app = document.getElementById("app");
const feed = document.createElement("div");
feed.classList.add("feed");

const items = Array(1000)
	.fill(null)
	.map((_, index) => template(getItem(index)))
	.join("")
	.trim();

feed.innerHTML = items;
console.log(items);

app.insertAdjacentElement("afterbegin", feed);
