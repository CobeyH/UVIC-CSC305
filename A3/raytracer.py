import sys
import numpy as np
import matplotlib.pyplot as plt

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
        return f'name {self.name}'

class Light:
    def __init__(self, data):
        self.name   = data[1]
        self.pos   = [float(data[2]), float(data[3]), float(data[4])]
        self.colour    = [float(data[5]), float(data[6]), float(data[7])]

    def __str__(self):
        return f'name {self.name} Colour: {self.colour}'

class Ray:
    def __init__(self, origin, direction, depth=1):
        self.origin = origin
        self.direction = direction
        self.depth = depth

    def __str__(self):
        return f'Origin: {self.origin} Direction: {self.direction}'

def hitCircle(ray, circle, invM):
    homoOrigin = np.append(ray.origin, 1)
    invS = np.matmul(invM, homoOrigin)[:3]
    homoDir = np.append(ray.direction, 0)
    invC = np.matmul(invM, homoDir)[:3]
    a = np.linalg.norm(invC)**2
    b = np.dot(invS, invC)
    c = np.linalg.norm(invS)**2 - 1
    discriminant = b*b - a * c
    if(discriminant < 0):
        return []
    else:
        return [-b / a + np.sqrt(discriminant) / (a), -b / a - np.sqrt(discriminant) / (a)]

def getReflectedRay(incident, P, N):
    normN = N / np.linalg.norm(N)
    v = -2 * np.dot(N, incident.direction) * N + incident.direction
    return Ray(P, v, incident.depth + 1)

def getLightValue(light, spheres, P, hitSphere, N):
    L = light.pos - P
    rayToLight = Ray(P, L)
    t, nearestSphere, _ = getNearestIntersect(spheres, rayToLight)
    if nearestSphere is not None:
        return [0,0,0] # Shadow
    normN = N / np.linalg.norm(N)
    normL = L / np.linalg.norm(L)
    diffuse = hitSphere.kd * np.multiply(light.colour, np.dot(normN, normL)) * hitSphere.colour
    V = np.array(P) * -1
    normV = V / np.linalg.norm(V)
    R = 2*np.multiply(np.dot(normN, L), normN) - L
    normR = R / np.linalg.norm(R)
    RdotV = np.dot(normR, normV)**hitSphere.n
    specular = hitSphere.ks * np.multiply(light.colour, RdotV)
    return np.add(diffuse, specular)


def getNearestIntersect(spheres, ray):
    closestCircle = None
    t = 100000
    for circle in spheres:
        M = [[circle.xScale, 0, 0, circle.xPos],[0, circle.yScale, 0, circle.yPos], [0, 0, circle.zScale, circle.zPos], [0, 0, 0, 1]]
        invM = [[1/circle.xScale, 0, 0, -circle.xPos/circle.xScale],[0, 1/circle.yScale, 0, -circle.yPos/circle.yScale], [0, 0, 1/circle.zScale, -circle.zPos/circle.zScale], [0, 0, 0, 1]]
        nextHits = hitCircle(ray, circle, invM)
        for hit in nextHits:
            if hit > 0.000001 and hit < t:
                t = hit
                closestCircle = circle
    invN = None
    if closestCircle is not None:
        center = np.array([closestCircle.xPos, closestCircle.yPos, closestCircle.zPos])
        P = ray.origin + ray.direction * t
        N = np.subtract(P, center)
        homoN = np.append(N, 1)
        inversed = np.matmul(homoN, np.linalg.inv(M))
        invN = np.matmul(np.linalg.inv(np.transpose(M)), inversed)[:3]
    return (t, closestCircle, invN)


def raytrace(ray, spheres, lights, sceneInfo):
    if ray.depth > MAX_DEPTH:
        return [0, 0, 0]
    nearestHit, closestCircle, N = getNearestIntersect(spheres, ray)
    if not closestCircle:
        if ray.depth == 1:
            return sceneInfo["BACK"]
        else:
            return [0,0,0]
    P = ray.origin + ray.direction * nearestHit
    diffuseLight = np.array([0,0,0])
    for light in lights:
        diffuseLight = np.add(diffuseLight, getLightValue(light, spheres, P, closestCircle, N))

    refRay = getReflectedRay(ray, P, N)
    reflectCol = raytrace(refRay, spheres, lights, sceneInfo)
    return closestCircle.ka * np.multiply(sceneInfo["AMBIENT"], closestCircle.colour) + diffuseLight + closestCircle.kr * np.array(reflectCol)

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
    image = np.zeros([height,width,3])
    u = np.array([1, 0, 0])
    v = np.array([0, 1, 0])
    n = np.array([0, 0, -1])
    for r in range(height):
        if(r % 10 == 0):
            print(r)
        for c in range(width):
        # must start in top right
            origin = CAMERA_POS
            xComp = info["RIGHT"] * (2.0 * float(c) / float(width) - 1)
            yComp = info["TOP"] * (2.0 * (height - r) / height - 1)
            zComp = info["NEAR"]
            # Add X, Y and Z components into direction vector
            direction = np.add(xComp * u, yComp * v)
            direction = np.add(direction, zComp * n)
            ray = Ray(origin, direction)
            pixelColour = raytrace(ray, spheres, lights, info)
            image[r][c] = np.clip(pixelColour, 0, 1)
    plt.imsave(outputFile, image)

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
                sceneInfo["AMBIENT"] = [float(sl[1]), float(sl[2]), float(sl[3])]
            elif(sl[0] == "OUTPUT"):
                outputFile = sl[1]
            else:
                print("Unexpected line identifier encountered")
    printData(sceneInfo, spheres, lights, outputFile)
    printPPM(sceneInfo, spheres, lights, outputFile)


if __name__ == '__main__':
    main()