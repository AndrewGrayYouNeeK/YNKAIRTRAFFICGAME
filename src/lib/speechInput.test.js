import assert from "node:assert/strict";
import test from "node:test";
import { getSpeechRecognition, speechErrorMessage, unsupportedSpeechMessage } from "./speechInput.js";

test("speech recognition is detected from the standard or webkit name", () => {
  assert.equal(getSpeechRecognition({}), null);
  assert.equal(getSpeechRecognition(undefined), null);
  function WebkitSpeech() {}
  assert.equal(getSpeechRecognition({ webkitSpeechRecognition: WebkitSpeech }), WebkitSpeech);
  function StandardSpeech() {}
  assert.equal(getSpeechRecognition({ SpeechRecognition: StandardSpeech }), StandardSpeech);
});

test("speech errors explain permission denial and unsupported browsers", () => {
  assert.match(speechErrorMessage("not-allowed"), /permission was denied/i);
  assert.match(speechErrorMessage("service-not-allowed"), /permission was denied/i);
  assert.match(speechErrorMessage("audio-capture"), /No microphone/);
  assert.equal(speechErrorMessage("aborted"), "");
  assert.match(speechErrorMessage("something-new"), /Speech recognition failed/);
  assert.match(unsupportedSpeechMessage(), /webkitSpeechRecognition/);
  assert.match(unsupportedSpeechMessage(), /iOS/);
});
