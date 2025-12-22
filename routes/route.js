import express from "express";
import { checkFileMatch, healthCheck } from "../controllers/controller.js";
import { signup, login, getProfile, verifyToken } from '../controllers/authentication/authController.js';
import {
  createDelivery,
  getMyDeliveries,
  cancelDelivery,
  getAllDeliveries,
  getPendingDeliveries,
  updateDeliveryStatus,
  assignOperator,
  uploadDeliveries
} from '../controllers/logisticsdelivery/deliveryController.js';
import { authenticateToken } from "../middleware/authMiddleware.js";
import { body, param } from 'express-validator';



const requireAuth = authenticateToken

// Validation for create
const validateCreateDelivery = [
  body('pickupLocation.address').notEmpty().withMessage('Pickup address required'),
  body('pickupLocation.coordinates').isArray({ min: 2, max: 2 }).withMessage('Coordinates must be [lng, lat]'),
  body('deliveryLocation.address').notEmpty().withMessage('Delivery address required'),
  body('deliveryLocation.coordinates').isArray({ min: 2, max: 2 }).withMessage('Coordinates must be [lng, lat]'),
  body('productDetails').notEmpty().withMessage('Product details required'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'emergency']).withMessage('Invalid priority'),
  body('notes').optional().isString()
];



const router = express.Router();




// POST /delivery/create_delivery
router.post('/create_delivery', requireAuth, createDelivery);

// GET /delivery/my_deliveries
router.get('/my_deliveries', requireAuth, getMyDeliveries);

// PUT /delivery/:deliveryId/cancel
router.put('/:deliveryId/cancel', requireAuth, [
  param('deliveryId').isMongoId().withMessage('Invalid delivery ID')
], cancelDelivery);

// GET /delivery/all_deliveries
router.get('/all_deliveries', getAllDeliveries);

// GET /delivery/pending
router.get('/pending', requireAuth, getPendingDeliveries);

// PUT /delivery/:deliveryId/update_status
router.put('/:deliveryId/update_status', requireAuth, [
  param('deliveryId').isMongoId().withMessage('Invalid delivery ID'),
  body('status').isIn(['accepted', 'in_transit', 'delivered', 'cancelled']).withMessage('Invalid status'),
  body('eta').optional().isInt({ min: 1 }).withMessage('ETA must be positive integer (minutes)')
], updateDeliveryStatus);

// POST /delivery/assign_operator
router.post('/assign_operator', requireAuth, [
  body('deliveryId').notEmpty().withMessage('Delivery ID required'),
  body('operatorId').isMongoId().withMessage('Valid operator ID required')
], assignOperator);

// POST /delivery/upload_delivery
router.post('/upload_delivery', requireAuth, uploadDeliveries);








router.post("/avm", checkFileMatch);
router.post('/signup' , signup);
router.post('/login',login);
router.get('/profile',verifyToken , getProfile);
router.get("/health", healthCheck);

export default router;
