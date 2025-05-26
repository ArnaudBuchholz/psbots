# 🤖 psbots

[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🍁 Overview

A project about a PostScript based programming language.

## 💿 Setup

* Clone https://github.com/ArnaudBuchholz/psbots
* `npm install`
* `npm run build`

## 🖥️ How to demo

### 🧑‍💻 Read-Eval-Print Loop

* Using cli: `npm run cli`
* Using web interface: `npm run wi`, open http://localhost:5173/

* 🛜 online demo : https://arnaudbuchholz.github.io/psbots/repl/index.html

### 🏓 pong

* `npm run dev --workspace pong`, open http://localhost:5173/

* 🛜 online demo : https://arnaudbuchholz.github.io/psbots/pong/index.html

## 📚 Project structure

This mono repository contains the following workspaces :

|Workspace|Description|
|---|---|
|`engine/`|psbots engine
|`docs/`|documentation published to https://arnaudbuchholz.github.io/psbots/. This folder is generated.
|`repl/`|Read-Eval-Print Loop core component
|`cli/`|Command line wrapper for `repl`
|`wi/`|Web wrapper for `repl`
|`pong/`|Pong game with paddles controlled by a psbot