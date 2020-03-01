import "jasmine";
import axios from "axios";

import * as User from "../accounts/user";
import { wait, asciiToHex } from "../utils";

const PORT = 3000;

describe("CouchDB Proxy", () => {
  beforeEach(async () => {
    await startApp(PORT);
    await clearCouchDB();
  });

  afterEach(async () => {
    try {
      await stopApp();
    } catch (e) {}
  });

  it("proxies admin requests to couchdb", async () => {
    const user = await User.create({
      email: "mail@gabrielpoca.com",
      password: "poca"
    });

    await wait(12000);

    await axios({
      method: "post",
      url: `http://localhost:${PORT}/db/userdb-${asciiToHex(user.name)}`,
      data: {
        test: "test"
      },
      headers: {
        "X-Auth-CouchDB-UserName": user.name,
        "X-Auth-CouchDB-Token": user.token
      }
    });

    const { data } = await axios.get(
      `http://localhost:${PORT}/db/userdb-${asciiToHex(user.name)}/_all_docs`,
      {
        headers: {
          "X-Auth-CouchDB-UserName": user.name,
          "X-Auth-CouchDB-Token": user.token
        }
      }
    );

    expect(data.total_rows).toBe(1);
  });
});
