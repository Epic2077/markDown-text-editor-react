export interface NoteTemplate {
  id: string;
  name: string;
  emoji: string;
  description: string;
  getTitle: () => string;
  getContent: () => string;
}

const today = () =>
  new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

export const noteTemplates: NoteTemplate[] = [
  {
    id: "daily",
    name: "Daily Note",
    emoji: "📅",
    description: "Plan your day with goals, tasks, and reflections",
    getTitle: () => `Daily Note — ${today()}`,
    getContent: () =>
      `## 🎯 Goals for Today

- [ ] 
- [ ] 
- [ ] 

## 📝 Tasks

- [ ] 
- [ ] 
- [ ] 

## 💡 Notes



## 🔄 End of Day Reflection

**What went well?**



**What could improve?**

`,
  },
  {
    id: "meeting",
    name: "Meeting Notes",
    emoji: "🤝",
    description: "Capture attendees, agenda, decisions, and action items",
    getTitle: () => `Meeting Notes — ${today()}`,
    getContent: () =>
      `## Meeting Info

- **Date:** ${today()}
- **Attendees:** 
- **Facilitator:** 

## 📋 Agenda

1. 
2. 
3. 

## 📝 Discussion Notes



## ✅ Decisions Made

- 

## 🎯 Action Items

| Task | Owner | Due |
|------|-------|-----|
|      |       |     |
|      |       |     |

## 📌 Follow-up

`,
  },
  {
    id: "project",
    name: "Project Plan",
    emoji: "🚀",
    description: "Outline goals, milestones, and tasks for a project",
    getTitle: () => "Project Plan — ",
    getContent: () =>
      `## Overview

> Brief description of the project and its purpose.

## 🎯 Goals

- 
- 

## 📅 Milestones

| Milestone | Target Date | Status |
|-----------|-------------|--------|
|           |             | 🔴     |
|           |             | 🔴     |
|           |             | 🔴     |

## 📝 Tasks

### Phase 1
- [ ] 
- [ ] 

### Phase 2
- [ ] 
- [ ] 

## 🔗 Resources

- 

## 📌 Notes

`,
  },
  {
    id: "todo",
    name: "Todo List",
    emoji: "✅",
    description: "Simple checklist to track tasks and progress",
    getTitle: () => "Todo List",
    getContent: () =>
      `## High Priority

- [ ] 
- [ ] 

## Medium Priority

- [ ] 
- [ ] 

## Low Priority

- [ ] 
- [ ] 

## Completed

- [x] _(move finished items here)_
`,
  },
  {
    id: "bug-report",
    name: "Bug Report",
    emoji: "🐛",
    description: "Document bugs with steps to reproduce and expected behavior",
    getTitle: () => "Bug Report — ",
    getContent: () =>
      `## Bug Description

> Describe the issue clearly and concisely.

## Environment

- **OS:** 
- **Browser / Runtime:** 
- **Version:** 

## Steps to Reproduce

1. 
2. 
3. 

## Expected Behavior



## Actual Behavior



## Screenshots / Logs

\`\`\`

\`\`\`

## Possible Fix

`,
  },
  {
    id: "code-snippet",
    name: "Code Snippet",
    emoji: "💻",
    description: "Save and document reusable code with notes",
    getTitle: () => "Code Snippet — ",
    getContent: () =>
      `## Description

> What does this snippet do?

## Code

\`\`\`js

\`\`\`

## Usage Example

\`\`\`js

\`\`\`

## Notes

- 
`,
  },
  {
    id: "reading",
    name: "Reading Notes",
    emoji: "📚",
    description: "Summarize articles, books, or papers with key takeaways",
    getTitle: () => "Reading Notes — ",
    getContent: () =>
      `## Source

- **Title:** 
- **Author:** 
- **URL / ISBN:** 

## Summary

> Brief overview of the main ideas.

## Key Takeaways

1. 
2. 
3. 

## Quotes

> 

## My Thoughts

`,
  },
  {
    id: "retro",
    name: "Retrospective",
    emoji: "🔄",
    description: "Team retrospective with what went well, improvements, and actions",
    getTitle: () => `Retrospective — ${today()}`,
    getContent: () =>
      `## 🟢 What Went Well

- 
- 

## 🔴 What Didn't Go Well

- 
- 

## 💡 Ideas / Improvements

- 
- 

## 🎯 Action Items

| Action | Owner | Due |
|--------|-------|-----|
|        |       |     |
|        |       |     |
`,
  },
];
