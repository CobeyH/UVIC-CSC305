[DONE] At least one two-level hierarchical object (e.g. human arm).
The scene has several hierarchical elements. The train locomotive has wheels that rotate and translate relative to it. There is also a bar that drives the wheels which rotates relative to the wheels.
Additionally, the train loading silo has an extended arm that rotates around the Y axis. Then a small arm extends from that larger arm around the end point of the large arm. After that, grains of rice fall relative to
the location of the small arm.
[DONE] At least two textures either procedural or mapped.
There are numerous mapped textures. The tree leaves, mountains, train, locomotive, sun and silo all have mapped textures.
[DONE] At least one shader edited or designed from scratch to perform a clearly visible effect. Each line of your shader must be commented clearly explaining exactly what the following line does and why. You must clearly identify the purpose and effect the shader produces in the submitted README.
There is a shader that effects the lighting in the sky. The vertical position of the sun is passed to the shader. Each pixel calculates its Euclidean distance to the sun and changes its red values inversely proportional to the distance from the sun. The sky gets pinker as the sun rises and the sky gets darker blue as the sun sets.
The shader was also edited for mapping textures.
Aside: I created a shader that used noise to generate a varied ground texture but gl_FragCoord is relative to the pixels coordinates to the screen instead of the world space coordinates.
This made the texture move relative to the rest of the terrain which looked bad. For this reason I removed the second shader. I left the code as a comment under my first shader edit.
[DONE] 360 degrees camera fly around using lookAt() and setMV().
The camera starts by tracking the trains position until 17 seconds. At that point the `at` position smoothly moves down before a 360 flyaround begins.
In the future I would like to add a camera angle from the prospective of the conductor looking down the tracks as the train drives. However, I didn't feel it was required for this project.
[DONE] Connection to real-time. You should make sure that your scene runs in real-time on fast enough machines. Real-time means that one simulated second corresponds roughly to one real second.
Yes, many components are tied to real time. Time is used to keyframe the start of animations such as the train stopping, grain pouring starting.
[DONE] You should display the frame rate of your program in the console window or the graphics window once every 2 seconds.
The framerate is printed out in the dev console every 2 seconds. It prints the number of frames that were rendered in the last 2 seconds.
On my computer there around around 115-120 frames every 2 seconds for an average of around 58 FPS. I wouldn't be surprised if the framerate suffered on lower spec computers since there are many scene elements. 
[DONE] Complexity: scene setup and design, movement of animated elements, and programming.
Up to the viewer but there is some code complexity that isn't obvious from looking at it. Several of the elements use randomization in both position and size to give the scene variety. The tree position, mountain position, mountain sized, and grain drop times are all calculated in the `onLoad` function and used during render time.
This means the animation is different each time the page is refreshed. To save resources the grain elements are re-used several times per animation cycle. When the grain vanishes inside the train, the position is reset to the top and the grain falls a second time. This allows for a continuous stream of grain to flow without using excessive system resources.
In addition, there is some math that slows down the train before it stops to preserve realism. The rest of the complexity is mostly obvious to the eye. 
[DONE] Creativity: storytelling, scene design, object appearance and other artistic elements.
[DONE] Quality:  Attention to detail, modeling quality, rendering quality, motion control.
[DONE] Programming style.
Each scene element is broken into it's own function with major sections being commented for clarity.