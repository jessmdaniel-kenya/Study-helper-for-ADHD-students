import io
import json
import unittest

from ai_service.prepare_dataset import SYSTEM_MESSAGE, prepare_dataset


class PrepareDatasetTests(unittest.TestCase):
    def test_converts_valid_examples_to_chat_jsonl(self):
        source = io.StringIO(
            '{"instruction":"Make a flashcard","input":"Plants use sunlight.","output":"What do plants use? Sunlight."}\n'
        )
        destination = io.StringIO()

        count = prepare_dataset(source, destination)
        example = json.loads(destination.getvalue())

        self.assertEqual(count, 1)
        self.assertEqual(example["messages"][0]["content"], SYSTEM_MESSAGE)
        self.assertIn("Plants use sunlight.", example["messages"][1]["content"])
        self.assertEqual(example["messages"][2]["content"], "What do plants use? Sunlight.")

    def test_rejects_malformed_and_empty_datasets(self):
        with self.assertRaisesRegex(ValueError, "Line 1: invalid JSON"):
            prepare_dataset(io.StringIO("{broken}\n"), io.StringIO())
        with self.assertRaisesRegex(ValueError, "no training examples"):
            prepare_dataset(io.StringIO("\n"), io.StringIO())

    def test_rejects_missing_output(self):
        with self.assertRaisesRegex(ValueError, "output"):
            prepare_dataset(io.StringIO('{"instruction":"A question"}\n'), io.StringIO())


if __name__ == "__main__":
    unittest.main()
