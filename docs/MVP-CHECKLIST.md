# StoryForge MVP Development Checklist

# MVP Goal
StoryForge's MVP will allow an author to create and share a writing project securely with a beta reader, recieve feedback, and manage that feedback.

The MVP must demonstrate the complete workflow:

Author creates project
* adds writing 
* shares with beta reader
* beta reader reads and comments
* author reviews feedback

---

# Development Rule

Do not  begin the next major development stage until the current stage is working and has been tested.

Each stage must meet its Definition of Done before moving forward

## Stage 1 - Project Setup
-[x] Create StoryForge repository
-[x] Clone repository locally
-[x] Add `.gitignore`
-[] Install required dependencies
-[] Confirm application runs locally
-[] Create base folder structure
-[] Create Initial README
-[] Make first clean commit

### Definition of Done
-[] Repository can be cloned
-[] Dependencies can be installed
-[] Application starts without errors

---
## Stage 2 - Authentication
-[] Create registration page
-[] Create login page
-[] Hash passwords securely
-[] Register users
-[] Log users in
-[] Log users out
-[] Protect authenticated routes
-[] Display useful authentication errors

### Definition of Done
-[] New user can register
-[] Registered users can log in
-[] Incorrect credentials are rejected
-[] Logged-out user cannot access protected pages
-[] User can log out successfully

---

## Stage 3 - Projects
-[] Create project model/table
-[] Create new project form
-[] Save project to database
-[] Assosiate project with its author
-[] Display author's projects
-[] Open induvidual project
-[] Edit basic project information
-[] Prevent users accessing projects they do not own

### Definition of Done
-[] Author can create a project
-[] Project persists after restart
-[] Project appears in author's dashboard
-[] Project ownership is enforced

--- 

## Stage 4 - Chapters/Scenes
-[] Create chapter model/table
-[] Add chapter to project
-[] Add chapter title (optional. Not all authors use chapter titles)
-[] Add manuscript text/content
-[] Edit chapter
-[] Delete chapter
-[] Display chapters within project
-[] Ensure chapters belong in the correct project

### Definition of Done
-[] Author can create a chapter
-[] Author can write/edit manuscript content
-[] Saved chapter persists
-[] Chapters display in the correct project

---

## Stage 5 - Beta Reader Sharing
-[] Create beta-reader access system
-[] Allow author to select/invite reader
-[] Associate reader with project
-[] Create reader permissions
-[] Allow reader to access shared project
-[] Prevent reader from editing manuscript
-[] Prevent unauthorised users accessing shared project

### Definition of Done
-[] Author can grant access to a beta reader
-[] Beta reader can open a shared work
-[] Other users cannot access the project
-[] Beta reader cannot edit author's manuscript

---

## Stage 6 - Comments / Feedback
-[] Create feedback model/table
-[] Allow beta reader to leave feedback
-[] Associate feedback with reader
-[] Associate feedback with chapter/project
-[] Display feedback to author
-[] Allow author to manage feedback

### Definition of Done
-[] Reader can submit feedback
-[] Feedback persists in database
-[] Author can see who submitted feedback
-[] Feedback appears on the correct work
-[] Unauthorised users cannot modify feedback

---

## Stage 7 - MVP Integration Test

Test the complete user journey.

### Author

- [ ] Register
- [ ] Log in
- [ ] Create project
- [ ] Add chapter
- [ ] Add manuscript content
- [ ] Share project with beta reader

### Beta Reader

- [ ] Log in
- [ ] Access shared project
- [ ] Read chapter
- [ ] Leave feedback

### Author

- [ ] Return to project
- [ ] View beta-reader feedback
- [ ] Manage feedback

### Definition of Done

- [ ] Entire workflow works from beginning to end
- [ ] No critical errors
- [ ] Permissions behave correctly
- [ ] Data persists correctly

---

# MVP COMPLETE

The StoryForge MVP is complete when an author can:

1. Register and log in
2. Create a writing project
3. Add chapters/scenes
4. Give a beta reader access
5. Share their writing securely
6. Receive comments/feedback
7. View and manage that feedback

---

# Future StoryForge Roadmap

These features are deliberately OUTSIDE the MVP.

- [ ] Google OAuth
- [ ] Expanded authentication/security
- [ ] Multiple books and series
- [ ] Multiple workspaces
- [ ] Advanced manuscript editor
- [ ] Alpha reader groups
- [ ] Beta reader groups
- [ ] Inline annotations
- [ ] Feedback categories
- [ ] Advanced role management
- [ ] Story Bible
- [ ] Character database
- [ ] Location database
- [ ] World-building tools
- [ ] Revision history
- [ ] Version history
- [ ] EPUB export
- [ ] DOCX export
- [ ] PDF export
- [ ] Backup system
- [ ] Co-author collaboration
- [ ] Analytics