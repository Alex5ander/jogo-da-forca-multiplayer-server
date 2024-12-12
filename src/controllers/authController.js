import express from 'express';
import { authSchema } from '../schemas/authSchema.js';
import { pbkdf2Sync } from 'crypto';
import { EncryptJWT, base64url, jwtDecrypt } from 'jose';
import { UserModel } from '../models/userModel.js';

const secretPassword = base64url.decode('zH4NRP1HMALxxCFnRZABFA7GOJtzU_gIj02alfL1lvI');
const secretJWT = base64url.decode('zH4NRP1HMALxxCFnRZABFA7GOJtzU_gIj02alfL1lvI');

const hash = (password) => pbkdf2Sync(password, secretPassword, 100, 10, 'sha1').toString('hex');
const sign = async (payload) => new EncryptJWT(payload)
  .setProtectedHeader({ alg: 'dir', enc: 'A128CBC-HS256' })
  .setIssuedAt().setIssuer('id:issuer')
  .setAudience('id:audience')
  .encrypt(secretJWT);
export class AuthController {

  /** @type {express.RequestHandler} */
  static async signin(req, res) {
    const { body } = req;

    const safeData = authSchema.safeParse(body);
    if (!safeData.success) {
      return res.status(403).end();
    }

    const { username, password } = safeData.data;

    const user = await UserModel.getByUsername(username);
    if (!user) {
      return res.status(403).end();
    }
    const hashPassword = hash(password);
    if (user.password == hashPassword) {
      const token = await sign({ id: user.id.toString() });
      res.cookie('token', token, { httpOnly: true, maxAge: 60000 * 10 })
      return res.json({ username: user.username });
    } else {
      return res.status(403).end();
    }
  }

  /** @type {express.RequestHandler} */
  static async signup(req, res) {
    const { body } = req;

    const safeData = authSchema.safeParse(body);
    if (!safeData.success) {
      return res.status(403).end();
    }

    const { username, password } = safeData.data;
    const hashPassword = hash(password);

    const lastID = await UserModel.create(username, hashPassword);
    if (!lastID) {
      return res.status(403).end();
    } else {
      const token = await sign({ id: lastID.toString() });
      res.cookie('token', token);
      res.status(201).end();
    }
  }

  /** @type {express.RequestHandler} */
  static async getUser(req, res) {
    const token = req.headers.cookie?.split('=')?.[1];

    try {
      const { payload } = await jwtDecrypt(token, secretJWT);
      const user = await UserModel.getById(payload.id);
      if (!user) {
        res.status(403).end();
      } else {
        res.json({ username: user.username });
      }
    } catch (err) {
      res.status(403).end();
    }
  }
}