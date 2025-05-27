# 🤖 psbots

> [⋔ Fork me on GitHub](https://github.com/ArnaudBuchholz/psbots)

## 📚 Documentation

> 🚧 Work in progress

* [List of operators](OPERATORS.md)
* [Samples](SAMPLES.md)

## 🧪 Online testing

A [repl](repl/index.html) tool provided to test the language.

## 🏓 pong

The classical [pong](https://en.wikipedia.org/wiki/Pong) game but with a twist : each pad is controlled with a psbot.

[🔗demo](pong/index.html)

> 🚧 This demo is a proof of concept
>
> The game starts immediately, use left / right arrow to speed up / down frames.
>
> Each paddle is controlled with a different script :
>
> * Left paddle (follow the ball) :
>
> ```postscript
> /main
> {
>   {
>     % Adjust pad position based on current position of the ball
>     ball_center_y % ball position
>     current_y paddle_height 2 div pop add % center of paddle
>     lt
>     {
>       paddle_up
>     }
>     {
>       paddle_down
>     }
>     ifelse
>   } loop
> } bind def
> ```
>
> * Right paddle (follow the ball when coming or center position) :
>
> ```postscript
> /main
> {
>   {
>     current_y paddle_height 2 div pop add % center of paddle
>   
>     current_x 0 eq ball_speed_x 0 lt and % left paddle, ball coming
>     current_x 0 neq ball_speed_x 0 gt and % right paddle, ball coming
>     or
>     {
>       % follow the ball
>       ball_center_y % ball position
>     }
>     {
>       % back to center
>       board_height 2 div pop % board center
>     }
>     ifelse
> 
>     lt
>     {
>       paddle_down
>     }
>     {
>       paddle_up
>     }
>     ifelse
>   } loop
> } bind def
> ```
