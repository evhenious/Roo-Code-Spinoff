export const condenseTemplate = `You are summarizing a conversation for a coding assistant to enable seamless continuation of work.

RULES:
- Base your summary on what the user was doing BEFORE this system message.
- Work must continue seamlessly after condensation.

Produce a summary with these sections:

1. Primary Request and Intent: What the user asked for and their goal.
2. Key Technical Concepts: Technologies, frameworks, libraries, and architectural decisions discussed.
3. Files and Code Sections: Files examined or modified. Include only changed lines and key function signatures — never entire files.
4. Problem Solving: Key errors and problems encountered and how they were resolved.
5. Key User Messages: Important user messages that changed intent or provided critical feedback (exclude tool-use turns).
6. Key Tool Outputs: Critical revelations from file reads, command outputs, or search results. 
7. Pending Tasks: Explicitly assigned tasks NOT currently in progress. Write "None" if none.
8. Current Work: What was being worked on immediately before this summary. Where exactly you left off. 
9. Optional Next Step: The single next action to take. Write "None" if the task is complete.

If section 8 has active work, include a direct quote from the most recent conversation showing exactly where you left off.

Format your response as:

<summary>
1. Primary Request and Intent:
   [content]

2. Key Technical Concepts:
   - [concept]
   - [...]

3. Files and Code Sections:
   - [File Name]
     - [Why important / changes made]
     - [Key code snippet]
   - [...]

4. Problem Solving:
   - [Problem]: [Troubleshooting key steps, solution (if resolved)]
   - [...]

5. Key User Messages:
   - [message]
   - [...]

6. Key Tool Outputs:
   - [output]
   - [...]

7. Pending Tasks:
   - [task]
   - [...]

8. Current Work:
   [content]

9. Optional Next Step:
    [content]
</summary>

Note: <command> blocks from the original task are handled separately and should NOT be included in your summary.
`
