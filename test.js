const HIBP = require("./lib");

main();

async function main() {
  const breaches = (await new HIBP().getBreaches())
    .name("MasterDeeds", "Estonia", "WienerBuchereien")
    .hasDomain("")
    .isSensitive(false)
    .isVerified()
    .hasDataClass("names", "job-titles")
    .sort("-PwnCount")
    .pluck(["Name"])
    .breaches();

  console.log(breaches);
}
