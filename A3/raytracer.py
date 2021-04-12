import sys
import numpy as np

MAX_DEPTH = 3
CAMERA_POS = [0,0,0]

class Sphere:
    def __init__(self, data):
        self.name   = data[1]
        self.xPos   = float(data[2])
        self.yPos   = float(data[3])
        self.zPos   = float(data[4])
        self.xScale = float(data[5])
        self.yScale = float(data[6])
        self.zScale = float(data[7])
        self.colour = [float(data[8]), float(data[9]), float(data[10])]
        self.ka     = float(data[11])
        self.kd     = float(data[12])
        self.ks     = float(data[13])
        self.kr     = float(data[14])
        self.n      = int(data[15])

    def __str__(self):
        return f'name {self.name} N: {self.n}'

class Light:
    def __init__(self, data):
        self.name   = data[1]
        self.xPos   = float(data[2])
        self.yPos   = float(data[3])
        self.zPos   = float(data[4])
        self.red    = float(data[5])
        self.green  = float(data[6])
        self.blue   = float(data[7])

    def __str__(self):
        return f'name {self.name} Blue: {self.blue}'

class Ray:
    def __init__(self, origin, direction):
        self.origin = origin
        self.direction = direction
        self.depth = 1

    def __str__(self):
        return f'Origin: {self.origin} Direction: {self.direction}'

class Hit:
    def __init__(self):
        self.norm   = [0,0,0]
        self.t      = 100000
        self.pos    = [0,0,0]
        self.colour = [0,0,0]

def hitCircle(ray, circle):
    invM = [[1.0/circle.xScale, 0, 0, -circle.xPos],[0, 1.0/circle.yScale, 0, -circle.yPos],[0, 0, 1.0/circle.zScale, -circle.zPos]]
    invS = np.matmul(invM, ray.origin + [1])[:3]
    homoDir = np.append(ray.direction, 0)
    invC = np.matmul(invM, homoDir)[:3]
    a = np.linalg.norm(invC)
    b = 2.0 * np.dot(invS, invC)
    c = np.linalg.norm(invS) - 1
    discriminant = b*b - 4 * a * c
    if(discriminant < 0):
        return []
    else:
        return [-b + np.sqrt(discriminant) / (2.0 * a), -b - np.sqrt(discriminant) / (2.0 * a)]


def raytrace(ray, spheres, sceneInfo):
    if ray.depth > MAX_DEPTH:
        return [0, 0, 0]
    nearestHit = 100000
    closestCircle = None
    for circle in spheres:
        nextHits = hitCircle(ray, circle)
        for hit in nextHits:
            if hit > 0 and hit < nearestHit:
                nearestHit = hit
                closestCircle = circle
    if not closestCircle:
        return sceneInfo["BACK"]
    return closestCircle.colour

# Function that prints all file information for debugging purposes
def printData(sceneInfo, spheres, lights, outputFile): 
    print(sceneInfo)
    for sphere in spheres:
        print(sphere)
    for light in lights:
        print(light)
    print(outputFile)

def printPPM(info, spheres, lights, outputFile):
    width = info["RES"]["x"]
    height = info["RES"]["y"]
    ppm_header = f'P6 {width} {height} {255}\n'
    image = [0, 0, 0] * width * height
    u = np.array([1, 0, 0])
    v = np.array([0, 1, 0])
    n = np.array([0, 0, -1])
    for c in range(width):
        for r in range(height):
            origin = CAMERA_POS
            xComp = info["RIGHT"] * (2.0 * c / width - 1)
            yComp = info["TOP"] * (2.0 * r / height - 1)
            zComp = info["NEAR"]
            # Add X, Y and Z components into direction vector
            direction = np.add(xComp * u, yComp * v)
            direction = np.add(direction, zComp * n)
            ray = Ray(origin, direction)
            pixelColour = raytrace(ray, spheres, info)
            startIndex = c * r * 3
            image[startIndex]     = int(pixelColour[0] * 255)
            image[startIndex + 1] = int(pixelColour[1] * 255)
            image[startIndex + 2] = int(pixelColour[2] * 255)
    with open('blue_example.ppm', 'wb') as f:
        f.write(bytearray(ppm_header, 'ascii'))
        f.write(bytearray(image))

def main():
    # Create objects to hold scene information
    fileName = sys.argv[1]
    sceneInfo = {}
    spheres = []
    lights = []
    outputFile = None
    # Parse file data
    with open(fileName) as fp:
        for i, line in enumerate(fp):
            sl = line.split()
            if(i < 5):
                sceneInfo[sl[0]] = float(sl[1])
            elif(sl[0] == "RES"):
                sceneInfo["RES"] = {}
                sceneInfo["RES"]["x"] = int(sl[1])
                sceneInfo["RES"]["y"] = int(sl[2])
            elif(sl[0] == "SPHERE"):
                spheres.append(Sphere(sl))
            elif(sl[0] == "LIGHT"):
                lights.append(Light(sl))
            elif(sl[0] == "BACK"):
                sceneInfo["BACK"] = [float(sl[1]), float(sl[2]), float(sl[3])]
            elif(sl[0] == "AMBIENT"):
                sceneInfo["AMBIENT"] = {}
                sceneInfo["AMBIENT"]["r"] = float(sl[1])
                sceneInfo["AMBIENT"]["g"] = float(sl[2])
                sceneInfo["AMBIENT"]["b"] = float(sl[3])
            elif(sl[0] == "OUTPUT"):
                outputFile = sl[1]
            else:
                print("Unexpected line identifier encountered")
    printData(sceneInfo, spheres, lights, outputFile)
    printPPM(sceneInfo, spheres, lights, outputFile)


if __name__ == '__main__':
    main()