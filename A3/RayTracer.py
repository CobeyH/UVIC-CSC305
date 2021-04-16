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

def normalize(v):
    return v / magnitude(v)

def magnitude(v):
    return (v[0]**2 + v[1]**2 + v[2]**2)**(1/2)

# Returns the distance to the intersections between a ray and a sphere.
# 0 solutions means no intersections
# 1 solution means the ray in a tangent line
# 2 solutions means the ray hits the front of the sphere and pierces through the sphere to and hits the back
def hitSphere(ray, sphere, invM, homoOrigin, homoDir):
    invS = np.matmul(invM, homoOrigin)[:3]
    invC = np.matmul(invM, homoDir)[:3]
    a = magnitude(invC)**2
    b = np.dot(invS, invC)
    c = magnitude(invS)**2 - 1
    discriminant = b*b - a * c
    if(discriminant < 0):
        return []
    else:
        return [-b / a + np.sqrt(discriminant) / (a), -b / a - np.sqrt(discriminant) / (a)]

# Returns the reflected off a sphere from an initial ray
# incident: the incoming ray that will reflect
# P: the point that incident intersects the sphere
# N: normal vector off the circle at point P
def getReflectedRay(incident, P, N):
    normN = normalize(N)
    v = -2 * np.dot(normN, incident.direction) * normN + incident.direction
    return Ray(P, v, incident.depth + 1)

# Returns True if a light should be included in the local illumination and False if the light is obscured
def contributesLight(startSphere, endSphere, side, distToIntersect, dirToLight):
    distToLight = np.dot(dirToLight, dirToLight)
    hitNear = True if side == "near" else False
    hitSphere = endSphere is not None
    hitSelf = False if not hitSphere else startSphere.name == endSphere.name

    # Light bounces off near face and to a light without hitting anything
    if not hitSphere and hitNear:
         return True
    # Light bounces of far face and the sphere has a light inside of it
    elif hitSelf and not hitNear and distToLight < distToIntersect:
        return True
    # Light bounces of near face and hits a sphere before hitting a light
    elif not hitSelf and hitNear:
        return False
    else:
        return False

# Returns the combined diffuse and specular value that a light contributes to a pixel
def getLightValue(light, spheres, P, hitSphere, N, near, side):
    L = light.pos - P
    rayToLight = Ray(P, L)
    t, nearestSphere, _, _ = getNearestIntersect(spheres, rayToLight)
    if(not contributesLight(hitSphere, nearestSphere, side, t, L)):
        return [0,0,0] # Shadow
    normN = normalize(N)
    normL = normalize(L)
    if side == "far":
        normN = -normN
    diffuse = hitSphere.kd * np.multiply(light.colour, np.dot(normN, normL)) * hitSphere.colour
    # Specular calculations
    specular = [0,0,0]
    V = np.array(P) * -1
    normV = normalize(V)
    R = 2*np.multiply(np.dot(normN, L), normN) - L
    normR = normalize(R)
    RdotV = np.dot(normR, normV)**hitSphere.n
    specular = hitSphere.ks * np.multiply(light.colour, RdotV)
    return np.add(diffuse, specular)

# Returns the nearest intersection between the spheres and a ray, the sphere that was hit, and the side (near or far) that the ray hit
def getNearestIntersect(spheres, ray, near=-1):
    closestCircle = None
    t = 100000
    for sphere in spheres:
        invM = [[1/sphere.xScale, 0, 0, -sphere.xPos/sphere.xScale],[0, 1/sphere.yScale, 0, -sphere.yPos/sphere.yScale], [0, 0, 1/sphere.zScale, -sphere.zPos/sphere.zScale], [0, 0, 0, 1]]
        homoOrigin = np.append(ray.origin, 1)
        homoDir = np.append(ray.direction, 0)
        nextHits = hitSphere(ray, sphere, invM, homoOrigin, homoDir)
        for hit in nextHits:
            zDist = 0
            # Don't calculate intersections in front of the near plane
            if near != -1:
                distAlongLine = np.array(ray.direction) * hit
                zDist = np.dot(np.array([0,0,-1]), distAlongLine)
            if hit > 0.000001 and hit < t and (zDist > near or ray.depth != 1):
                t = hit
                closestCircle = sphere
    invN = None
    side = None
    # Calculate the normal vector if a sphere was hit
    if closestCircle is not None:
        M = [[closestCircle.xScale, 0, 0, closestCircle.xPos],[0, closestCircle.yScale, 0, closestCircle.yPos], [0, 0, closestCircle.zScale, closestCircle.zPos], [0, 0, 0, 1]]
        center = np.array([closestCircle.xPos, closestCircle.yPos, closestCircle.zPos])
        P = ray.origin + ray.direction * t
        N = np.subtract(P, center)
        homoN = np.append(N, 1)
        inversed = np.matmul(homoN, np.linalg.inv(M))
        invN = np.matmul(np.linalg.inv(np.transpose(M)), inversed)[:3]
        side = "far" if np.dot(ray.direction, invN) > 0 else "near"
    return (t, closestCircle, invN, side)

# Main function that returns the colour for a pixel
def raytrace(ray, spheres, lights, sceneInfo):
    if ray.depth > MAX_DEPTH:
        return [0, 0, 0]
    nearestHit, closestCircle, N, side = getNearestIntersect(spheres, ray, sceneInfo["NEAR"])
    if not closestCircle:
        if ray.depth == 1:
            return sceneInfo["BACK"]
        else:
            return [0,0,0]
    P = ray.origin + ray.direction * nearestHit
    diffuseLight = np.array([0,0,0])
    for light in lights:
        diffuseLight = np.add(diffuseLight, getLightValue(light, spheres, P, closestCircle, N, sceneInfo["NEAR"], side))
    ambient = closestCircle.ka * np.multiply(sceneInfo["AMBIENT"], closestCircle.colour)
    refRay = getReflectedRay(ray, P, N)
    return ambient + diffuseLight + closestCircle.kr * np.array(raytrace(refRay, spheres, lights, sceneInfo))

# Function that prints all file information for debugging purposes
def printData(sceneInfo, spheres, lights, outputFile): 
    print(sceneInfo)
    for sphere in spheres:
        print(sphere)
    for light in lights:
        print(light)
    print(outputFile)

# Iterates though each pixel and calls the raytrace function
def printPPM(info, spheres, lights, outputFile):
    width = info["RES"]["x"]
    height = info["RES"]["y"]
    ppm_header = f'P6 {width} {height} {255}\n'
    image = np.zeros([width * height * 3])
    u = np.array([1, 0, 0])
    v = np.array([0, 1, 0])
    n = np.array([0, 0, -1])
    percentInc = int(height / 10)
    for r in range(height):
        if(r % percentInc == 0):
            print(f'{r / percentInc * 10}% Complete')
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
            startIndex = 3 * (r * width + c)
            clippedPix = np.clip(pixelColour, 0, 1) * 255
            image[startIndex]     = int(clippedPix[0])
            image[startIndex + 1] = int(clippedPix[1])
            image[startIndex + 2] = int(clippedPix[2])
    with open(outputFile, 'wb') as f:
     	f.write(bytearray(ppm_header, 'ascii'))
     	image.astype('int8').tofile(f)
    print("Render Complete. Output to", outputFile)

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
            if len(sl) == 0:
                continue
            if(sl[0] == "RES"):
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
               sceneInfo[sl[0]] = float(sl[1])
    # Do ray tracing and write output to PPM
    printPPM(sceneInfo, spheres, lights, outputFile)


if __name__ == '__main__':
    main()