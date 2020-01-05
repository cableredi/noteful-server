CREATE TABLE notes (
  id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
  noteName TEXT NOT NULL,
  folderId INTEGER REFERENCES folders(id) ON DELETE CASCADE NOT NULL,
  content TEXT,
  modified TIMESTAMP NOT NULL DEFAULT now()
);