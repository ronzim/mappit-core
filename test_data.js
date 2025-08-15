const fs = require("fs-extra");
const { loadData, filterData, simplifyData } = require("./src/data.js");

async function runTest() {
  const rawData = await loadData("./Records.json");
  const filteredData = filterData(rawData, ['2022-08-06T09:00:00.000Z', '2022-08-06T10:30:00.000Z']);
  const simplifiedData = simplifyData(filteredData);
  fs.writeJsonSync("simplified_data.json", { locations: simplifiedData });
  console.log("Test finished, check simplified_data.json");
}

runTest();
