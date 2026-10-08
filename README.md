# Shinro

Shinro is a study planner app built with Expo and React Native. Upload your syllabus as a PDF, and Shinro breaks it into units, topics and subtopics, so you always know what to study next.

> **This is proprietary software. All rights reserved.**
> You may not use, copy, modify or distribute any part of this project without written permission from the owner. See [Copyright and permission](#copyright-and-permission).

## Features

- Upload a syllabus PDF and generate a study roadmap
- Track progress across units, topics and subtopics
- Follow the roadmaps you're working on and see them on the Home screen
- Sign in with email and password
- Set a profile photo

## Tech stack

- [Expo](https://expo.dev) SDK 57 with [Expo Router](https://docs.expo.dev/router/introduction/)
- React Native and TypeScript
- [Better Auth](https://www.better-auth.com) for authentication

## Running the project

These steps are for the owner and for anyone who has been given written permission.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the project root with the backend URL:

   ```bash
   EXPO_PUBLIC_BASE_URL=<your backend URL>
   ```

3. Start the app:

   ```bash
   npx expo start
   ```

The app needs its backend API running to sign in and load roadmaps.

## Copyright and permission

Copyright © 2026 shailjayadav30. All Rights Reserved.

This project is **not** open source. No license is granted to use it. Without prior written permission, you may not:

- use, run or deploy this project, in whole or in part
- copy or redistribute the code
- modify it or build other work based on it
- sell it or use it commercially

Being able to see this repository does not mean you may use it.

**Want to use this project?** Email the owner at [shailjayadav7275@gmail.com](mailto:shailjayadav7275@gmail.com) (or reach out on GitHub at [@shailjayadav30](https://github.com/shailjayadav30)) and describe how you want to use it. You may use it only after you receive written permission.

The full terms are in [LICENSE](LICENSE).
