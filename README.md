# SmartHome Admin Dashboard

A comprehensive admin dashboard for managing smart home devices, users, and automations.

## Features

### 🔐 Authentication

- User registration and login
- JWT token-based authentication
- Role-based access control (Admin/Customer)
- Protected routes

### 👥 User Management (Admin Only)

- View all users
- Create new users
- Edit user information
- Delete users
- Role management

### 🏠 Home Management

- Create and manage smart homes
- Assign homes to users
- View home details and statistics

### 🚪 Room Management

- Create rooms within homes
- Room type categorization
- Device assignment to rooms

### 🔌 Device Management

- Add and configure smart devices
- Device type support (lights, sensors, switches, cameras, thermostats, door locks)
- Real-time device status monitoring
- Device-room associations

### 🤖 Automation Management

- Create smart home automations
- Define triggers and actions
- Enable/disable automations
- Automation scheduling
- Privacy Wall protection

### 🎭 Scene Management

- Create and manage smart home scenes
- Group multiple device actions
- Execute scenes instantly
- Scene scheduling and automation

### 📊 Sensor Data Monitoring

- View real-time sensor readings
- Historical data visualization
- Device-specific data filtering
- Time range selection

### 🏥 System Health Monitoring

- Application health checks
- System status monitoring
- Uptime tracking
- Performance metrics

### ⚙️ Settings

- User profile management
- Notification preferences
- Security settings
- Appearance customization

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Context API
- **HTTP Client**: Fetch API

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository

```bash
git clone <repository-url>
cd smarthome-admin
```

2. Install dependencies

```bash
npm install
```

3. Create environment file

```bash
cp .env.example .env.local
```

4. Configure environment variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

5. Run the development server

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### API Integration

The application expects a REST API with the following endpoints:

#### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

#### Users Management

- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/{id}` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

#### Homes Management

- `GET /api/homes/{id}` - Get home by ID
- `GET /api/homes/owner/{ownerId}` - Get homes by owner
- `POST /api/homes` - Create new home
- `PUT /api/homes/{id}` - Update home
- `DELETE /api/homes/{id}` - Delete home

#### Rooms Management

- `GET /api/rooms/home/{homeId}` - Get rooms by home
- `POST /api/rooms` - Create new room
- `PUT /api/rooms/{id}` - Update room
- `DELETE /api/rooms/{id}` - Delete room

#### Devices Management

- `GET /api/Devices/{id}` - Get device by ID (returns DeviceId, RoomId, Name, DeviceType, CurrentState)
- `GET /api/Devices/room/{roomId}` - Get devices by room
- `POST /api/Devices` - Create new device (Admin only) - requires RoomId, Name, DeviceType, CurrentState
- `PUT /api/Devices/{id}` - Update device name only (Admin: full update, Customer: name only)
- `DELETE /api/Devices/{id}` - Delete device (Admin only)
- `POST /api/Devices/{id}/control` - Control device (send Action and Value)

#### Automations Management

- `GET /api/Automations/home/{homeId}` - Get automations by home (Customer only, Privacy Wall)
- `GET /api/Automations/{id}` - Get automation by ID
- `POST /api/Automations` - Create new automation (Customer only)
- `PUT /api/Automations/{id}` - Update automation name and enabled status only (Customer only)
- `DELETE /api/Automations/{id}` - Delete automation (Customer only)
- `PATCH /api/Automations/{id}/toggle` - Toggle automation enabled/disabled (Customer only)

#### Scenes Management

- `GET /api/Scenes/home/{homeId}` - Get scenes by home (Customer only, Privacy Wall)
- `POST /api/Scenes` - Create new scene (Customer only) - requires HomeId, Name, Description, Actions array
- `POST /api/Scenes/{id}/execute` - Execute scene (run all actions)
- `DELETE /api/Scenes/{id}` - Delete scene (Customer only)

#### Sensor Data Management

- `POST /api/SensorData` - Create sensor data (Admin only) - requires DeviceId, Value, TimeStamp?
- `GET /api/SensorData/{id}` - Get sensor data by ID (Customer only, Privacy Wall)
- `GET /api/SensorData/device/{deviceId}/latest` - Get latest sensor data (Customer only)
- `GET /api/SensorData/device/{deviceId}` - Query sensor data with time range & pagination (Customer only)

#### Device Mappings (Provisioning)

- `POST /api/admin/mappings` - Create device mapping
- `GET /api/admin/mappings` - Get all device mappings (Admin only)
- `DELETE /api/admin/mappings/{id}` - Delete device mapping (Admin only)

#### Health Check

- `GET /api/health/live` - Live health check
- `GET /api/health/ready` - Ready health check (Admin only)
- `GET /api/health/info` - System information

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── page.tsx           # Dashboard
│   ├── users/             # User management
│   ├── homes/             # Home management
│   ├── rooms/             # Room management
│   ├── devices/           # Device management
│   ├── automations/       # Automation management
│   ├── scenes/            # Scene management
│   ├── sensor-data/       # Sensor data monitoring
│   ├── health/            # System health
│   └── settings/          # Settings
├── components/            # React components
│   ├── auth/              # Authentication components
│   ├── layout/            # Layout components
│   └── ui/                # UI components
├── contexts/              # React contexts
├── services/              # API services
└── types/                 # TypeScript type definitions
```

## Features Overview

### Dashboard

- Real-time statistics
- Recent activity feed
- Quick access to all features
- Role-based data display

### User Management

- Complete CRUD operations
- Role assignment
- User search and filtering
- Bulk operations support

### Device Management

- Multiple device types support
- Real-time status monitoring
- Device configuration
- Room assignment

### Automation Management

- Trigger-based automations
- Action configuration
- Status management
- Scheduling support
- Privacy Wall protection

### Scene Management

- Scene creation and management
- Multiple device action grouping
- Instant scene execution
- Scene automation integration

### Sensor Data

- Real-time data visualization
- Historical data analysis
- Device-specific filtering
- Export capabilities

### System Health

- Live monitoring
- Performance metrics
- Alert system
- Auto-refresh functionality

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.
