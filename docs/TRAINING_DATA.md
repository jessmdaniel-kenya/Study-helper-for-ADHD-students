# Training data preparation

The repository includes a local format-conversion helper, not model training. `ai_service/prepare_dataset.py` converts instruction/input/output JSON Lines (JSONL) examples into generic chat-completion JSONL. It does not upload data, call NVIDIA, fine-tune a model, or include training examples.

## Input format

Use a UTF-8 text file with one JSON object per line. Each object must have a non-empty string `instruction` and `output`. `input` is optional and must be a string when present. Blank lines are skipped.

```jsonl
{"instruction":"Make a flashcard","input":"Plants use sunlight to make food.","output":"What do plants use to make food? Sunlight."}
{"instruction":"Explain this idea","output":"A concise explanation."}
```

## Convert the file

```sh
python -m ai_service.prepare_dataset --input examples.jsonl --output prepared.jsonl
```

The output directory is created if needed. Input and output paths must differ. The command reports how many examples were prepared and exits with an error that identifies the line for malformed JSON or invalid fields. An empty dataset is rejected.

Each output line has a `messages` array with a fixed system instruction, a user message containing the instruction and optional `Study material:` section, and an assistant message containing the output. The output is generic chat JSONL; a provider-specific training format may require another conversion step.

## Handling examples responsibly

Review and anonymize examples before sending them to any training provider. Do not include personal, sensitive, or copyrighted material unless you have the rights and approvals needed. Training examples are excluded from Git through the ignored `training-data/` and `prepared-training-data/` paths; keep raw and generated datasets out of source control.
