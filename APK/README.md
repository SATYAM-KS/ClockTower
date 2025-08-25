# RedZone Safety App

A comprehensive safety monitoring application built with React, TypeScript, and Supabase.

## Features

### 🛡️ Enhanced Safety Monitoring
- **Voice Recognition**: Detects emergency keywords like "help", "SOS", "danger"
- **Audio Level Monitoring**: Detects sudden loud sounds and silence anomalies
- **Movement Detection**: Monitors acceleration, deceleration, and sudden stops
- **Stationary User Detection**: Alerts when user remains still for extended periods
- **Automatic Safety Checks**: Periodic safety confirmations with escalation

### 🚨 Emergency Features
- **SOS System**: One-tap emergency alert system
- **Emergency Contacts**: Manage and notify emergency contacts
- **Red Zone Detection**: GPS-based dangerous area identification
- **Real-time Alerts**: Instant notifications for safety threats

### 🗺️ Location Services
- **Live Map**: Interactive map with red zone overlays
- **Route Analysis**: Safe route planning and analysis
- **Geofencing**: Automatic alerts when entering dangerous areas

### 👥 User Management
- **Authentication**: Secure user login and registration
- **Profile Management**: User preferences and emergency settings
- **Admin Dashboard**: Administrative tools for safety monitoring

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (Database, Authentication, Real-time)
- **Styling**: Tailwind CSS + CSS Modules
- **Maps**: Leaflet + React-Leaflet
- **UI Components**: Radix UI + Lucide React Icons
- **Deployment**: Netlify

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd REDZONE-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   VITE_SUPABASE_URL=https://shqfvfjsxtdeknqncjfa.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## Supabase Setup

### Database Tables

The app requires the following Supabase tables:

- `app_users` - User profiles and information
- `admin_users` - Administrative user management
- `red_zones` - Dangerous area definitions
- `sos_alerts` - Emergency alert records
- `emergency_contacts` - User emergency contacts
- `emergency_contact_requests` - Contact request management

### Authentication

- Supabase Auth handles user registration and login
- Row Level Security (RLS) policies protect user data
- Admin status is checked via the `admin_users` table

## Deployment

### Netlify Deployment

1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Environment Variables

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Project Structure

```
src/
├── components/          # Reusable UI components
├── context/            # React context providers
├── pages/              # Application pages
├── utils/              # Utility functions and services
├── styles/             # Global styles and CSS modules
└── types/              # TypeScript type definitions
```

## Key Components

- **EnhancedSafetyMonitoring**: Core safety monitoring functionality
- **AdminDashboard**: Administrative interface
- **SOS**: Emergency alert system
- **RedZones**: Map and zone management
- **SafetyMonitor**: Background safety monitoring service

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the GitHub repository.
