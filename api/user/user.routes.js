import express from 'express'

import { addUser, getUser, getUsers, updateUser } from './user.controller.js'

export const userRoutes = express.Router()


userRoutes.get('/', getUsers)
userRoutes.post('/:lang',  addUser)
userRoutes.get('/:email', getUser)
userRoutes.put('/:email',  updateUser)

// userRoutes.delete('/:id',  requireAuth, requireAdmin, deleteUser)
