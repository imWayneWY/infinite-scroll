import { ListComponent } from "./list/list";
import { FeedItem, getItem } from "./utils/data.utils";
import { db } from "./utils/db.utils";

const templateFn = ({ name, description, url }: FeedItem) => {
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

const DB_SIZE = 1000;

const root: HTMLDivElement = document.getElementById("app") as HTMLDivElement;
const DB = db(DB_SIZE, DB_SIZE, getItem);
const feed = new ListComponent<FeedItem>(root, {
	templateFn,
	load: () => DB.load(0, 1000).then((cursor) => cursor.chunk)
});
feed.render();
