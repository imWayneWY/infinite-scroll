import { LazyListComponent } from "./lazyList/lazyList";
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
</section>`.trim();
}

const DB_SIZE = 1000;

const root: HTMLDivElement = document.getElementById("app") as HTMLDivElement;
const DB = db(DB_SIZE, DB_SIZE, getItem);
const feed = new LazyListComponent<FeedItem>(root, {
	templateFn,
	load: (start, limit) => DB.load(start, limit).then((cursor) => cursor.chunk),
	pageSize: 10
});
feed.render();
