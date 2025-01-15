# 🤖 pspong

## Overview

The classical [pong](https://en.wikipedia.org/wiki/Pong) game but with a twist : each pad is controlled with a psbot.

It will be possible to build and test a pad controller, fight against existing pad controllers.

## Constraints

Several constraints are defined :

* Dimensions and coordinates are expressed in pixels
  * (0,0) is the top left corner
* The time unit of measure is based on ?
  * Speeds (ball, pad) are expressed in pixels / unit of measure
* Each engine will have limitations, they are not necessarily equivalent
  * Number of cycles per unit of time
  * Memory
* Pad controllers I/O :
  * Input :
    * ball information (`ball_center_x`, `ball_center_y`, `ball_radius`, `ball_x_speed`, `ball_y_speed`)
    * arena information (`arena_width`, `arena_height`, `pad_width`, `pad_height`)
    * current center pad position (`current_center_y`, `current_x`)
    * opponent pad position (`opponent_y`, `opponent_x`)
  * Output :
    * direction (`up` or `down`)
   
## Example psbot

```postscript
{
  ball_center_y current_center_y lt
  {
    "up" set_direction
  }
  {
    "down" set_direction
  }
  ifelse
} loop
```
