import os
import subprocess

for file in os.listdir("."):
    if file.endswith(".txt"):
        print(file)
        subprocess.run(["python3", "RayTracer.py", file])
