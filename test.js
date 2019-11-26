const HIBP = require("./lib");

main();

async function main() {
  const breaches = (await new HIBP().getBreaches())
    .name("MasterDeeds", "Estonia", "WienerBuchereien", "Adobe", "LinkedIn")
    .hasDomain("")
    .isSensitive(false)
    .isVerified()
    .hasDataClass("names", "job-titles")
    .sort("-PwnCount")
    .pluck("Name", "PwnCount")
    .breaches();

  console.log(breaches);
}
