const path = require('path');
const express = require('express');
const xss = require('xss');
const NotesService = require('./notes-service');

const notesRouter = express.Router()
const jsonParser = express.json()

const serializeNotes = note => ({
  id: note.id,
  noteName: xss(note.noteName),
  folderId: note.folderId,
  content: xss(note.content),
  modified: new Date(note.modified),
})

notesRouter
  .route('/')

  .get((req, res, next) => {
    const knexInstance = req.app.get('db')
    NotesService.getAllNotes(knexInstance)
      .then(folders => {
        res.json(folders.map(serializeNotes))
      })
      .catch(next)
  })

  .post(jsonParser, (req, res, next) => {
    const { noteName, folderId, modified, content } = req.body
    const newNote = { noteName, folderId, modified }

    for (const [key, value] of Object.entries(newNote)) {
      if (value == null) {
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        })
      }
    }

    newNote.content = content;

    NotesService.insertNote(
      req.app.get('db'),
      newNote
    )
      .then(note => {
        res
          .status(201)
          .location( path.posix.join(req.originalUrl + `/${note.id}`) )
          .json(serializeNotes(note))
      })
      .catch(next)
  })

notesRouter
  .route('/:note_id')

  .all((req, res, next) => {
    NotesService.getById(
      req.app.get('db'),
      req.params.note_id
    )
      .then(note => {
        if (!note) {
          return res.status(404).json({
            error: { message: `Note doesn't exist` }
          })
        }
        res.note = note // save the note for the next middleware
        next() // don't forget to call next so the next middleware happens!
      })
      .catch(next)
  })

  .get((req, res, next) => {
    res.json(serializeNotes(res.note))
  })

  .delete( (req,res, next) => {
    NotesService.deleteNote(
      req.app.get('db'),
      req.params.note_id
    )
      .then( () => {
        res.status(204).end()
      })
      .catch(next)
  })

  .patch(jsonParser, (req, res, next) => {
    const { noteName, folderId, content } = req.body
    const noteToUpdate = { noteName, folderId }

    const numberOfValues = Object.values(noteToUpdate).filter(Boolean).length
    if (numberOfValues === 0) {
      return res.status(400).json({
        error: {
          message: `Request body must contain a note name and folder`
        }
      })
    }

    noteToUpdate.content = content;

    NotesService.updateNote(
      req.app.get('db'),
      req.params.note_id,
      noteToUpdate
    )
      .then(numRowsAffected => {
        res.status(204).end()
      })
      .catch(next)
  })

module.exports = notesRouter