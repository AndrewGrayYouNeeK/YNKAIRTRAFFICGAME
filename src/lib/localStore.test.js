import assert from "node:assert/strict";
import test from "node:test";
import {
  clearRecords,
  createRecord,
  filterRecords,
  listRecords,
  subscribeRecords,
  sumField,
  updateRecord,
} from "./localStore.js";

test("session landings and scores stay in local storage for unlocks", async () => {
  const collection = `ATCSession-landings-${Math.random().toString(36).slice(2)}`;
  clearRecords(collection);
  await createRecord(collection, {
    status: "completed",
    airport_id: "KLAX",
    successful_landings: 3,
    score: 450,
  });
  await createRecord(collection, {
    status: "completed",
    airport_id: "KJFK",
    successful_landings: 2,
    score: 200,
  });

  const sessions = await listRecords(collection, "-created_date", 200);
  assert.equal(sessions.length, 2);
  assert.equal(sumField(sessions, "successful_landings"), 5);
  assert.equal(sumField(sessions, "score"), 650);

  const completed = await filterRecords(collection, { status: "completed" });
  assert.equal(completed.length, 2);
});

test("updating a session keeps the same id and new score", async () => {
  const collection = `ATCSession-update-${Math.random().toString(36).slice(2)}`;
  clearRecords(collection);
  const created = await createRecord(collection, { status: "active", score: 0, successful_landings: 0 });
  const events = [];
  const unsubscribe = subscribeRecords(collection, (event) => events.push(event.type));
  const updated = await updateRecord(collection, created.id, { score: 100, successful_landings: 1, status: "completed" });
  unsubscribe();

  assert.equal(updated.id, created.id);
  assert.equal(updated.score, 100);
  assert.equal(updated.successful_landings, 1);
  assert.deepEqual(events, ["update"]);

  const listed = await listRecords(collection);
  assert.equal(listed[0].status, "completed");
});
