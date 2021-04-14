All components required for the test cases have been implemented. 
This includes ambient light, diffuse light, shadows, specularity, reflections, near plane intersections, and lights inside spheres.

The program was build in python so it is quite slow (~1 minute to run each file on my computer).
The two program requirements are numpy, which the assignment description said we could use, and `sys` for input and output.

In the future I would like to multithread the program so that one pixel colour is calculated on each core of the computer.
However, issues were encountered during implementation so it was left out for now.

The program can be run by executing the following command:
    python3 raytracer.py <inputfile.txt>