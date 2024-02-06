import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'
import axios from 'axios'
import mongodb from 'mongodb'
import dotenv from 'dotenv'
dotenv.config()

const { ObjectId } = mongodb
const KEY = process.env.API_KEY

export const userService = {
    query,
    getByEmail,
    remove,
    update,
    add
}

async function query(filterBy = {}) {
    const criteria = _buildCriteria(filterBy)
    try {
        const collection = await dbService.getCollection('truma_users')
        var users = await collection.find(criteria).toArray()
        users = users.map(user => {
            // delete user.password
            user.createdAt = ObjectId(user._id).getTimestamp()
            return user
        })
        return users
    } catch (err) {
        logger.error('cannot find users', err)
        throw err
    }
}

async function getByEmail(email) {
    try {
        const collection = await dbService.getCollection('truma_users')
        const user = await collection.findOne({ email })
        return user
    } catch (err) {
        logger.error(`while finding user ${email}`, err)
        throw err
    }
}

async function remove(userId) {
    try {
        const collection = await dbService.getCollection('truma_users')
        await collection.deleteOne({ _id: ObjectId(userId) })
    } catch (err) {
        logger.error(`cannot remove user ${userId}`, err)
        throw err
    }
}

async function update(user) {
    try {
        const userToSave = {
            _id: ObjectId(user._id),
            email: user.email,
            name: user.name,
        }
        const userCollection = await dbService.getCollection('truma_users')
        await userCollection.updateOne({ _id: userToSave._id }, { $set: userToSave });
        return userToSave
    } catch (err) {
        logger.error(`cannot update user ${user._id}`, err)
        throw err
    }
}

async function add(user, lang) {
    try {
        const existUser = await getByEmail(user.email)
        if (existUser) return existUser

        const userToAdd = {
            email: user.email,
            createdAt: Date.now()
        }
        const collection = await dbService.getCollection('truma_users')
        await collection.insertOne(userToAdd)
        if (lang === 'eng') {
            sendSuccessEmailEng(user.email)
        } else {
            sendSuccessEmailHeb(user.email)
        }
        userToAdd._id = null
        return userToAdd
    } catch (err) {
        logger.error('cannot insert user', err)
        throw err
    }
}

function _buildCriteria(filterBy) {
    const criteria = {}
    if (filterBy.txt) {
        const txtCriteria = { $regex: filterBy.txt, $options: 'i' }
        criteria.$or = [
            {
                email: txtCriteria
            },
            {
                name: txtCriteria
            }
        ]
    }
    return criteria
}

async function sendSuccessEmailHeb(email) {
    const res = await axios.post('https://mandrillapp.com/api/1.0/messages/send-template.json', {
        key: KEY,
        template_name: 'register-hebrew',
        template_content: [
            { name: '', content: '' },
        ],
        message: {
            subject: 'נהדר! נכנסת להגרלה של פתיל תכלת',
            from_email: 'info@tekhelet.com',
            to: [
                { email }
            ]
        }
    })
}

async function sendSuccessEmailEng(email) {
    const res = await axios.post('https://mandrillapp.com/api/1.0/messages/send-template.json', {
        key: KEY,
        template_name: 'register-english',
        template_content: [
            { name: '', content: '' },
        ],
        message: {
            subject: '',
            from_email: 'info@tekhelet.com',
            to: [
                { email }
            ]
        }
    })
}