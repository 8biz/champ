# CHAMP Tools

## Overview

- **CHAMP Tools** is a collection of tools to support the wrestling competition office.
- **CHAMP Tools** will be operated by wrestling clubs, referees, and other stakeholders in the wrestling community.
- **CHAMP tools** shall be designed to work well in the often chaotic environment of a wrestling competition.
- **CHAMP tools** users will have a strong focus on usability, reliability. The behavior of the tools should be intuitive and predictable, and the tools should be robust against errors and unexpected inputs. 
- The tools are designed to be open source, easy to install and maintain, and suitable for hobbyists and solo developers.
- The tools will be developed independently, but will share common specifications and design principles.
- The frontend tools
    - shall run in a modern web browsers on both desktop and mobile devices.
    - preferred technologies for frontend tools shall be **HTML**, **CSS**, and **JavaScript**.
    - support of multiple languages, including German and English.
- The backend tools
    - shall be easy to run on a local machine, without the need for a server or cloud infrastructure.
    - Preferred language for backend tools shall be **Python**.
- The tools will be designed to work well in offline scenarios, where internet connectivity may be limited or unavailable.
- Each will be developed of its own.

## Project Structure

- Folder `spec`: Contains common specification, that apply to all subprojects of **CHAMP Tools**.
- Folder `spec/glossary`: Contains common terminology and definitions used across all subprojects of **CHAMP Tools**. Each term is listed and described in english. Additionally, wrestling-specific terms contains its german translations.
- Folder `spec/architecture`
- Folder `common/frontend`: Contains common frontend components, styles, and utilities that can be shared across multiple frontend tools.
- Folder `common/backend`: Contains common backend components, utilities, and libraries that can be shared across multiple backend tools.
- Folder `protocol`: Contains the frontend tool **CHAMP protocol**. It is used to protocolize the events shown by a referee while a wrestling bout.
- Folder `protocol/protocol.html`: The self-contained, single-file web application using HTML, CSS, and JavaScript implementing **CHAMP protocol** tool.
- Folder `protocol/spec`: Contains the specification for the **CHAMP protocol** tool.
- Folder `protocol/tests`: Contains automated tests for the **CHAMP protocol** tool.
- Folder `protocol/docs`: Contains user documentation for the **CHAMP protocol** tool, including user guides, API documentation, and design decisions.

More subprojects and folder will be added in the future.

## Coding Standards

- Write clean and readable code.
- Try to write self-explanatory code by using monads, functional programming techniques and fluent interfaces where appropriate to avoid unnecessary comments and documentation.
- Use common design patterns and best practices to ensure maintainability and scalability of the codebase. Document why and how these patterns are used in the codebase, and provide examples where necessary.
- Use meaningful variable and function names that clearly indicate their purpose.
- Follow the PEP 8 style guide for Python code and the Airbnb JavaScript Style Guide for JavaScript code.
- Use consistent formatting and indentation throughout the codebase.
- Write unit tests for all new code and ensure that existing tests are not broken by new changes.
- Use version control (Git) effectively, with clear commit messages and regular commits to the repository.
- Document any non-obvious code or design decisions in the codebase, and provide clear explanations for why certain approaches were taken.
- Keep the codebase organized and modular, with clear separation of concerns between different components and modules.
- Keep the codebase as simple as possible, avoiding unnecessary complexity and over-engineering.
- Keep the documentation up to date with the codebase, and ensure that it is clear and easy to understand for both developers and users.

## Development Environment

- GitHub Codespaces, to simplify the onboarding for developers. See the `.devcontainer/` folder for details.
- GitHub Actions for continuous integration (CI) and automated testing. See the `.github/workflows/` folder for details.
- Playwright for automated frontend testing. See the `tests/` folder in each subproject for details.
    - Run `npx playwright install` to install the necessary browser binaries.
    - Run `npx playwright test` to execute the tests.
- Repository language is English
