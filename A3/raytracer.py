import sys

class Sphere:
    def __init__(self, data):
        self.name   = data[1]
        self.xPos   = float(data[2])
        self.yPos   = float(data[3])
        self.zPos   = float(data[4])
        self.xScale = float(data[5])
        self.yScale = float(data[6])
        self.zScale = float(data[7])
        self.red    = float(data[8])
        self.green  = float(data[9])
        self.blue   = float(data[10])
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

# Function that prints all file information for debugging purposes
def printData(sceneInfo, spheres, lights, outputFile): 
    print(sceneInfo)
    for sphere in spheres:
        print(sphere)
    for light in lights:
        print(light)
    print(outputFile)

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
                sceneInfo["BACK"] = {}
                sceneInfo["BACK"]["r"] = float(sl[1])
                sceneInfo["BACK"]["g"] = float(sl[2])
                sceneInfo["BACK"]["b"] = float(sl[3])
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


if __name__ == '__main__':
    main()