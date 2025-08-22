# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **Rampart Rager** ultra marathon race results website - a React-based web application for displaying race results with AWS Amplify backend integration. The application supports three race distances (100K, 70K, 50K) and provides real-time race results with administrative capabilities.

## Architecture

### Frontend (`src/`)
- **React application** with single main component (`App.js`)
- **Styling**: Uses Tailwind CSS classes for responsive design
- **State management**: Local React state (useState hooks)
- **UI Features**: 
  - Race distance tabs (100K/70K/50K)
  - Overall winners display
  - Category winners (Open/Masters/Veteran)
  - Complete results table
  - Admin mode for editing results
  - File upload for Excel race data

### Backend (AWS Amplify)
- **GraphQL API**: Defined in `amplify/backend/api/rampartrager/schema.graphql`
  - `RaceResult` model: Stores individual runner results
  - `RaceMeta` model: Stores race metadata and timestamps
- **Lambda Functions**: 
  - `processRaceResults`: Processes uploaded Excel files and updates DynamoDB
- **Storage**: S3 bucket for Excel file uploads
- **Authentication**: Public access configured for race results

## Development Commands

React application with full AWS integration:
- **Install dependencies**: `npm install --legacy-peer-deps`
- **Start development server**: `npm start` (runs on http://localhost:3000)
- **Build production**: `npm run build`
- **Test**: `npm test`

### AWS Amplify Commands
- **Push backend changes**: `amplify push`
- **Pull backend status**: `amplify pull`
- **Check status**: `amplify status`

## Key Files and Structure

```
src/
├── App.js              # Main React component with all functionality
├── amplifyconfiguration.json  # Amplify client configuration
├── aws-exports.js      # Generated AWS configuration
├── graphql/            # Generated GraphQL operations
└── models/             # Generated model definitions

amplify/backend/
├── api/rampartrager/
│   └── schema.graphql  # GraphQL schema definition
├── function/processRaceResults/
│   └── src/index.js    # Excel processing Lambda function
└── storage/racedata/   # S3 bucket configuration
```

## Data Models

### RaceResult
- `bib`: Runner's bib number
- `firstName`, `lastName`: Runner identification  
- `elapsedTime`: Race completion time
- `race`: Distance (100K/70K/50K)
- `category`: Age group (Open/Masters/Veteran)
- `gender`: MALE/FEMALE
- `place`: Overall finishing position

### Excel Processing
The Lambda function processes Excel files with sheets:
- `Sheet 1 - registration_report`: Registration data for category/age lookup
- `100K`, `70K`, `50K`: Individual race results sheets

## Current State

**Production Ready**: Both React frontend and AWS backend are fully integrated and deployed.

**Features Working**:
- AWS Amplify backend deployed successfully
- React development server running on localhost:3000
- GraphQL API integration for race results
- File upload to S3 with Lambda processing
- Admin mode for editing results
- Real-time data loading from DynamoDB

**Known Issues**:
- Dependency warnings (cosmetic, doesn't affect functionality)
- Need `--legacy-peer-deps` flag for npm install due to React version conflicts

## Notes

- Full React build system with Create React App
- Tailwind CSS loaded via CDN for styling
- GraphQL API automatically generated from schema
- Admin mode allows result editing and file uploads with live AWS integration
- Excel processing via Lambda function supports automatic race result imports

## Troubleshooting

If deployment fails:
1. Use `amplify push --allow-destructive-graphql-schema-updates` for schema changes
2. Check AWS credentials are configured: `aws configure list`
3. Ensure all Lambda dependencies are in package.json

If React server won't start:
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install --legacy-peer-deps`
3. If ajv errors persist, run `npm install ajv@^8.0.0 --save-dev`