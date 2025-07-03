* When a method *may* fail either because of its direct content or its subsequent calls, it *must* returns a `Result`.

* When an object instantiation *may* fail (because of the constructor), encapsulate the object creation in a factory returning a `Result`.

* Even if a method is not supposed to fail, it is possible to use exceptions to detect unexpected situation. This will crash the engine.
