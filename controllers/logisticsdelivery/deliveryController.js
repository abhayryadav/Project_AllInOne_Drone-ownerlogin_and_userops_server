// controllers/deliveryController.js
import Delivery from '../../models/delivery.js';
import User from '../../models/user.js';
import { validationResult } from 'express-validator';

export const createDelivery = async (req, res) => {
  console.log("Create Delivery Request Body:", req.body);
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // if (req.user.userType !== 'client') {
    //   return res.status(403).json({ message: 'Only clients can create deliveries' });
    // }

    const { pickupLocation, deliveryLocation, ...rest } = req.body;

    const deliveryData = {
      ...rest,
      userId: req.userId,

      pickupLocation: {
        address: pickupLocation.address,
        coordinates: {
          type: "Point",
          coordinates: pickupLocation.coordinates
        }
      },

      deliveryLocation: {
        address: deliveryLocation.address,
        coordinates: {
          type: "Point",
          coordinates: deliveryLocation.coordinates
        }
      }
    };

    const delivery = new Delivery(deliveryData);
    await delivery.save();

    res.status(201).json({
      message: 'Delivery request created successfully',
      deliveryId: delivery.deliveryId,
      status: delivery.status
    });
  } catch (error) {
    console.error("Create Delivery Error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getMyDeliveries = async (req, res) => {
  try {
    const deliveries = await Delivery.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('assignedOperatorId', 'name email');

    res.json({ deliveries });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const cancelDelivery = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { deliveryId } = req.params;
    const { reason } = req.body;

    const delivery = await Delivery.findOne({ deliveryId, userId: req.user._id });
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    if (delivery.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending deliveries can be cancelled' });
    }

    if (req.user.userType !== 'client') {
      return res.status(403).json({ message: 'Only clients can cancel their deliveries' });
    }

    delivery.status = 'cancelled';
    delivery.cancellationReason = reason || 'User cancelled';
    delivery.updatedAt = new Date();
    await delivery.save();

    res.json({ message: 'Delivery cancelled successfully', deliveryId });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAllDeliveries = async (req, res) => {
  try {
    // if (!['operator', 'super_operator'].includes(req.user.userType)) {
    //   return res.status(403).json({ message: 'Access denied' });
    // }
    console.log("Get All Deliveries Query Params:", req.query);
    const { status, priority, page = 1, limit = 10 } = req.query;
    let query = {};
    console.log("Query Parameters:", req.query);
   


    if (status && status !== "all") {
      query.status = status;
    }

    if (priority && priority !== "all") {
      query.priority = priority;
    }

    console.log("MongoDB Query Object:", query);
    const deliveries = await Delivery.find(query)
      .sort({ priority: -1, createdAt: 1 })
      .populate('userId', 'name email contactNo')
      .populate('assignedOperatorId', 'name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    console.log("Fetched Deliveries:", deliveries);
    const total = await Delivery.countDocuments(query);

    res.json({
      deliveries,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getPendingDeliveries = async (req, res) => {
  try {
    if (!['operator', 'super_operator'].includes(req.user.userType)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { limit = 20 } = req.query;
    const deliveries = await Delivery.find({ status: 'pending' })
      .sort({ priority: -1, createdAt: 1 })
      .populate('userId', 'name email contactNo')
      .limit(parseInt(limit))
      .lean();

    res.json({ pendingDeliveries: deliveries });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateDeliveryStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!['operator', 'super_operator'].includes(req.user.userType)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { deliveryId } = req.params;
    const { status, eta } = req.body;

    const delivery = await Delivery.findOne({ deliveryId });
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    if (status === 'delivered' && delivery.status !== 'in_transit') {
      return res.status(400).json({ message: 'Cannot deliver without starting transit' });
    }

    delivery.status = status;
    if (eta) delivery.eta = eta;
    if (status === 'cancelled') delivery.cancellationReason = req.body.reason || 'Cancelled by operator';
    delivery.assignedOperatorId = req.user._id;
    delivery.updatedAt = new Date();
    await delivery.save();

    res.json({ message: `Status updated to ${status}`, deliveryId });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const assignOperator = async (req, res) => {
  try {
    console.log("Assign Operator Request Body:", req.body);
    

    const { deliveryId, operatorId } = req.body;
    console.log("Delivery ID:", deliveryId, "Operator ID:", operatorId);
    // const operator = await User.findById(operatorId);
    // if (!operator || operator.userType !== 'operator') {
    //   return res.status(400).json({ message: 'Invalid operator' });
    // }

    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    delivery.assignedOperatorId = operatorId;
    delivery.status = 'accepted';
    await delivery.save();

    res.json({ message: 'Operator assigned successfully', deliveryId });
  } catch (error) {
    console.error("Assign Operator Error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const uploadDeliveries = async (req, res) => {
  try {
    if (req.user.userType !== 'super_operator') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const deliveriesData = req.body.deliveries || [];
    if (!Array.isArray(deliveriesData) || deliveriesData.length === 0) {
      return res.status(400).json({ message: 'Invalid or empty delivery data' });
    }

    const savedDeliveries = [];
    for (const data of deliveriesData) {
      const delivery = new Delivery({
        ...data,
        userId: data.userId
      });
      await delivery.save();
      savedDeliveries.push(delivery.deliveryId);
    }

    res.json({ message: `${savedDeliveries.length} deliveries uploaded`, deliveryIds: savedDeliveries });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};