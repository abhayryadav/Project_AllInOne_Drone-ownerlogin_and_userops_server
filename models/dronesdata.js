import mongoose from 'mongoose';


const flightLogSchema = new mongoose.Schema({
    // Basic Identification
    droneId: {
        type: String,
        required: true,
        index: true
    },
    missionId: {
        type: String,
        index: true
    },
    flightSessionId: {
        type: String,
        index: true
    },
    timestamp: { 
        type: Date, 
        default: Date.now,
        index: true
    },

    // Position & Attitude (3D Visualization)
    globalPosition: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
        altitude: { type: Number, required: true }, // AMSL (Above Mean Sea Level)
        relative_alt: { type: Number }, // Relative to home position
        alt_ellipsoid: { type: Number } // Ellipsoid altitude
    },
    
    attitude: {
        roll: { type: Number }, // radians
        pitch: { type: Number }, // radians
        yaw: { type: Number }, // radians
        rollspeed: { type: Number }, // rad/s
        pitchspeed: { type: Number }, // rad/s
        yawspeed: { type: Number } // rad/s
    },

    // Movement & Velocity
    velocity: {
        vx: { type: Number }, // X velocity in NED frame (m/s)
        vy: { type: Number }, // Y velocity in NED frame (m/s)
        vz: { type: Number }, // Z velocity in NED frame (m/s)
        groundspeed: { type: Number }, // m/s
        airspeed: { type: Number }, // m/s
        heading: { type: Number } // degrees
    },

    // GPS & Navigation
    gpsData: {
        fix_type: { 
            type: Number, 
            enum: [0, 1, 2, 3, 4, 5, 6], // 0-1: no fix, 2: 2D, 3: 3D, 4: DGPS, 5: RTK Float, 6: RTK Fixed
            default: 0 
        },
        satellites_visible: { type: Number },
        hdop: { type: Number }, // Horizontal dilution of precision
        vdop: { type: Number }, // Vertical dilution of precision
        eph: { type: Number }, // GPS HDOP horizontal dilution of precision
        epv: { type: Number } // GPS VDOP vertical dilution of precision
    },

    // Battery & Power System
    battery: {
        voltage: { type: Number }, // volts
        current: { type: Number }, // amps
        remaining: { type: Number }, // percentage
        charge_consumed: { type: Number }, // mAh
        time_remaining: { type: Number }, // seconds
        temperature: { type: Number } // celsius
    },

    // Flight Control & Modes
    flightMode: {
        type: String,
        enum: [
            'STABILIZE', 'ACRO', 'ALT_HOLD', 'AUTO', 'GUIDED', 'LOITER', 
            'RTL', 'CIRCLE', 'LAND', 'DRIFT', 'SPORT', 'FLIP', 
            'AUTOTUNE', 'POSHOLD', 'BRAKE', 'THROW', 'AVOID_ADSB',
            'GUIDED_NOGPS', 'SMART_RTL', 'FLOWHOLD', 'FOLLOW', 'ZIGZAG'
        ]
    },
    baseMode: {
        custom: Boolean,
        guided: Boolean,
        auto: Boolean,
        test: Boolean,
        system: Boolean,
        manual: Boolean,
        armed: Boolean,
        stabilized: Boolean
    },
    systemStatus: {
        type: String,
        enum: [
            'UNINIT', 'BOOT', 'CALIBRATING', 'STANDBY', 'ACTIVE', 
            'CRITICAL', 'EMERGENCY', 'POWEROFF', 'FLIGHT_TERMINATION'
        ]
    },
    // Camera & Gimbal
    camera: {
        trigger: { type: Boolean },
        recording: { type: Boolean },
        zoom: { type: Number },
        focus: { type: Number }
    },
    gimbal: {
        pitch: Number,
        roll: Number,
        yaw: Number,
        mode: {
            type: String,
            enum: ['FOLLOW', 'LOCK', 'RC']
        }
    },

    // Environmental Data
    environment: {
        temperature: Number,
        pressure: Number,
        humidity: Number,
        wind_speed: Number,
        wind_direction: Number
    },

    // Safety & Failsafe
    safety: {
        geofence: {
            breached: Boolean,
            action: {
                type: String,
                enum: ['NONE', 'GUIDED', 'HOLD', 'TERMINATE', 'LAND', 'RETURN']
            }
        },
        proximity: {
            object_detected: Boolean,
            distance: Number,
            direction: String
        },
        parachute: {
            enabled: Boolean,
            altitude: Number
        },
        adsb: {
            traffic_detected: Boolean,
            resolution: String
        }
    },
    // Statistics
    statistics: {
        flight_time: Number, // seconds
        distance_traveled: Number, // meters
        max_altitude: Number,
        max_speed: Number,
        max_distance: Number
    }
}, {
    timestamps: true, // Adds createdAt and updatedAt
    strict: false // Allow for dynamic MAVLink message expansion
});

// Indexes for efficient querying
flightLogSchema.index({ droneId: 1, timestamp: -1 });
flightLogSchema.index({ 'globalPosition.latitude': 1, 'globalPosition.longitude': 1 });
flightLogSchema.index({ flightSessionId: 1 });
flightLogSchema.index({ 'metadata.flight_phase': 1 });

const userDroneSchema = new mongoose.Schema({
    saltedToken: {
        type: String,
        required: true
    },
    military: [{
        droneId: String,
        flightLogs: [flightLogSchema]
    }],
    disaster: [{
        droneId: String,
        flightLogs: [flightLogSchema]
    }],
    delivery: [{
        droneId: String,
        flightLogs: [flightLogSchema]
    }],
    surveillance: [{
        droneId: String,
        flightLogs: [flightLogSchema]
    }],
    agricultural: [{
        droneId: String,
        flightLogs: [flightLogSchema]
    }],
    recreational: [{
        droneId: String,
        flightLogs: [flightLogSchema]
    }]
});


const UserDrone = mongoose.model('UserDrone', userDroneSchema);
export default UserDrone;