import puppeteer from "puppeteer";

if (!process.env.NESA_USER) {
	console.log("NESA_USER is not set");
	process.exit(1);
}
if (!process.env.NESA_PASS) {
	console.log("NESA_PASS is not set");
	process.exit(1);
}

export default (): Promise<any> => {
	return new Promise((res) => {
		puppeteer.launch().then((browser) => {
			browser.newPage().then((page) => {
				page
					.goto(
						"https://bzwu.nesa-sg.ch/loginto.php?pageid=21311&mode=0&lang=en"
					)
					.then(() => {
						page
							.type(
								"input[type=text][name=login]",
								process.env.NESA_USER as string
							)
							.then(() => {
								page
									.type(
										"input[type=password][name=passwort]",
										process.env.NESA_PASS as string
									)
									.then(() => {
										page.click("input[type=submit][value=Login]").then(() => {
											page
												.waitForNavigation({ timeout: 10000 })
												.catch((err) => {
													browser.close();
													console.log(err);
												})
												.then(() => {
													page.$$("page>div>table>tbody>tr").then((rows) => {
														let i = 1;
														const data: any[] = [];
														while (i < rows.length) {
															let generalInfo = {
																title: "",
																description: "",
																average: 0,
															};
															let items: any | undefined = undefined;
															rows[i]
																.$$eval<{
																	title: string;
																	description: string;
																	average: string;
																}>("td", (elm) =>
																	elm
																		? elm[0]
																			? {
																					title:
																						elm[0].children &&
																						elm[0].children[0]
																							? elm[0].children[0].innerHTML
																							: elm[0].innerHTML,
																					description: elm[0].innerHTML.slice(
																						elm[0].innerHTML.indexOf("<br>") + 4
																					),
																					average: elm[1].innerHTML
																						.replace("*", "")
																						.trim(),
																			  }
																			: {
																					title: "",
																					description: "",
																					average: "--",
																			  }
																		: {
																				title: "",
																				description: "",
																				average: "--",
																		  }
																)
																.then((b: any) => {
																	generalInfo.title = b.title.toString();
																	generalInfo.description =
																		b.description.toString();
																	if (b.average && !isNaN(b.average))
																		generalInfo.average = b.average;
																	parseFloat((generalInfo.average = b.average));
																	if (items !== undefined) {
																		data.push({ ...generalInfo, items });
																		if (data.length === Math.floor(i / 3 - 1)) {
																			res(data);
																			browser.close();
																		}
																	}
																});
															rows[i + 1]
																.$$eval<any>("td>table>tbody>tr", (elems) => {
																	const keys = Array.from(
																		elems[0].children
																	).map((elm: any) =>
																		elm
																			? elm.children
																				? elm.children[0] &&
																				  elm.children[0].children &&
																				  elm.children[0].children[0]
																					? elm.children[0].children[0].innerHTML.toLowerCase()
																					: elm.children[0].innerHTML.toLowerCase()
																				: ""
																			: ""
																	);
																	const values: any[] = [];
																	elems
																		.slice(1, elems.length - 1)
																		.forEach((elem) => {
																			if (elem && elem.children) {
																				const celem: any = {};
																				Array.from(
																					elem.children as any
																				).forEach((elm: any, i) => {
																					if (elm) {
																						celem[keys[i]] =
																							elm.childElementCount
																								? elm.innerHTML
																										.slice(
																											0,
																											elm.innerHTML.indexOf("<")
																										)
																										.trim()
																								: elm.innerHTML.trim();
																					}
																				});
																				values.push(celem);
																			}
																		});
																	return values;
																})
																.then((elems) => {
																	items = elems;
																	if (generalInfo.title) {
																		data.push({ ...generalInfo, items });
																		if (data.length === Math.floor(i / 3 - 1)) {
																			browser.close();
																			res(data);
																		}
																	}
																});
															i += 3;
														}
													});
												});
										});
									});
							});
					});
			});
		});
	});
};
