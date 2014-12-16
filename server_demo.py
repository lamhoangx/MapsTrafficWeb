#!/usr/bin/python
import SocketServer
import json
import mysql.connector
import time
import decimal
import math
from mysql.connector import errorcode

class MyTCPServer(SocketServer.ThreadingTCPServer):
	allow_reuse_address = True
def recv_timeout(the_socket,timeout=2):
	#make socket non blocking
	the_socket.setblocking(0)
	 
	#total data partwise in an array
	total_data=[];
	data='';
	 
	#beginning time
	begin=time.time()
	while 1:
		#if you got some data, then break after timeout
		if total_data and time.time()-begin > timeout:
			break
		 
		#if you got no data at all, wait a little longer, twice the timeout
		elif time.time()-begin > timeout*2:
			break
		 
		#recv something
		try:
			data = the_socket.recv(8192)
			if data:
				total_data.append(data)
				#change the beginning time for measurement
				begin = time.time()
			else:
				#sleep for sometime to indicate a gap
				time.sleep(0.1)
		except:
			pass
	 
	#join all parts to make final string
	return ''.join(total_data)
def parserHeader(data):
	header = data.split("\r\n\r\n")[0]
	print "header:",header
	datalines = header.splitlines()
	print "Lines:",datalines
	if("POST" in datalines[0]):
		method = "POST"
	else:
		method = "GET"
	HTTPversion = datalines[0].split(" ")[2]
	mydict = {};
	mydict["method"] = method
	mydict["HTTPversion"] = HTTPversion
	for i in xrange(1,len(datalines)):
		requestfield = datalines[i].split(": ") 
		mydict[requestfield[0]] = requestfield[1]
	return mydict
def parserData(data):
	try:
		data = json.loads(data.split("\r\n\r\n")[1])
	except Exception, e:
		data = {"Message":"Error","Error":str(e)}
		return data
	if "diadiem" in data.keys():
		return insertFound(data)
	elif "street" in data.keys():
		return findFound(data)
	
	
def insertFound(data):
	data_location = (data["diadiem"],str(decimal.Decimal(data["locationX"])), str(decimal.Decimal(data["locationY"])), data["loivipham"])
	add_location = ("INSERT INTO tb_location (diadiem, locationX, locationY, loivipham) VALUES (%s, %s, %s, %s)")
	rows = selectDB()
	for row in rows:
		print row,data["locationX"],data["locationY"]
		if(row[2]==float(data["locationX"]) and row[3]==float(data["locationY"])):
			data = {}
			data["loivipham"] = row[4]
			data["locationX"] = row[2]
			data["locationY"] = row[3]
			data["diadiem"] = row[1]
			data["Error"]="Location "+str(decimal.Decimal(data["locationX"]))+","+str(decimal.Decimal(data["locationY"]))+" exist in Database!"
			data["Message"]="Insert Fail"
			return data
	insert2DB(data_location,add_location)
	data["Message"] = "Insert Success"
	return data
	
def findFound2Point(data,founds):
	N = decimal.Decimal("0.00015")
	dlkc = decimal.Decimal("0.00015") # Do lech khoang cach 30m
	finalFound = []
	allPoints = data["street"]
	for i in xrange(1,len(allPoints)):
		x1 = decimal.Decimal(allPoints[i-1]["latitude"])
		x2 = decimal.Decimal(allPoints[i]["latitude"])
		y1 = decimal.Decimal(allPoints[i-1]["longitude"])
		y2 = decimal.Decimal(allPoints[i]["longitude"])
		XMIN = min(x1,x2)
		XMAX = max(x1,x2)
		YMIN = min(y1,y2)
		YMAX = max(y1,y2)
		a = x2-x1
		b = y1-y2
		c = x1*(x1-x2)+y1*(y2-y1)
		for f in founds:
			if  f[2] < XMAX+N and f[2] > XMIN-N and f[3] < YMAX+N and f[3] > YMIN-N:
				kc = decimal.Decimal(abs(a*decimal.Decimal(f[2])+b*decimal.Decimal(f[3])+c)/decimal.Decimal(math.sqrt(a*a+b*b)))
				print x1,y1,x2,y2,f[2],f[3],kc
				if kc < dlkc:
					finalFound.append(f)
	return finalFound
def findFound(data):
	# {"street":[{"latitude":"10.849710000000002","longitude":"106.77166000000001"},{"latitude":"10.84964","longitude":"106.77213"},{"latitude":"10.8496","longitude":"106.77285"},{"latitude":"10.849580000000001","longitude":"106.77337000000001"},{"latitude":"10.84952","longitude":"106.77351"},{"latitude":"10.849400000000001","longitude":"106.77372000000001"},{"latitude":"10.849260000000001","longitude":"106.77391000000001"},{"latitude":"10.84903","longitude":"106.77415"},{"latitude":"10.849480000000002","longitude":"106.77458000000001"},{"latitude":"10.850280000000001","longitude":"106.77550000000001"}]}
	# print type(data["street"])
	# print data["street"]
	# print "\n\n\n\n",data["street"][0],type(data["street"][0])
	XMAX = decimal.Decimal(data["street"][0]["latitude"])
	XMIN = decimal.Decimal(data["street"][0]["latitude"])
	YMAX = decimal.Decimal(data["street"][0]["longitude"])
	YMIN = decimal.Decimal(data["street"][0]["longitude"])
	for itm in data["street"]:
		X = decimal.Decimal(itm["latitude"])
		if  X > XMAX:
			XMAX = X
		elif X < XMIN:
			XMIN = X
		Y = decimal.Decimal(itm["longitude"])
		if Y > YMAX:
			YMAX = Y
		elif Y < YMIN:
			YMIN = Y
	# print "X:",XMAX,XMIN
	# print "Y:",YMAX,YMIN
	# print selectDB()
	founds = selectDB("where locationX<"+str(decimal.Decimal(XMAX))+" and locationX>"+str(decimal.Decimal(XMIN))+" and locationY<"+str(decimal.Decimal(YMAX))+" and locationY>"+str(decimal.Decimal(YMIN)))
	# print founds,type(founds)
	if len(founds)>0:
		finalFound = findFound2Point(data,founds)
		print "finalFound",finalFound
		listFound = []
		founddata = {}
		for itm in finalFound:
			found = {}
			found["loivipham"] = itm[4]
			found["locationX"] = str(itm[2])
			found["locationY"] = str(itm[3])
			found["diadiem"] = itm[1]
			listFound.append(found)
		founddata["Message"]= "Found"
		founddata["AllFound"] = listFound
	else:
		founddata = {}
		founddata["Message"]= "No Found"
	return founddata
def insert2DB(data,add):
	cursor.execute(add, data)
	cnx.commit()
def selectDB(condition=""):
	# print condition
	cursor.execute("SELECT * from tb_location "+condition)
	result = cursor.fetchall()
	return result
class MyTCPServerHandler(SocketServer.BaseRequestHandler):
	def handle(self):
		data2send = {}
		try:
			data = recv_timeout(self.request,timeout=2)
			print "Recv from client:",data
			if(data==""):
				data2send = {"Message:":"Nothing"}
				self.request.sendall(json.dumps(data2send))
				return
		except Exception, e:
			print "Exception wile receiving message: ", e
			data2send["Message"]=str(e)
			print data2send
			self.request.sendall(json.dumps({"return":e}))

		print self.request.getpeername()
		mydict = parserHeader(data)
		if(mydict["method"]=="GET"):
			data2send["Message"] = "Wellcome Demo Mobile Application"
			data2send["ip"] = self.request.getpeername()
		else:
			data2send = parserData(data)
		print "Send to client:","HTTP/1.1\nAccess-Control-Allow-Origin: *\r\n\r\n"+json.dumps(data2send)
		print "="*40
		self.request.sendall("HTTP/1.1\nAccess-Control-Allow-Origin: *\r\n\r\n"+json.dumps(data2send))
try:
	cnx = mysql.connector.connect(user='root', password='cs332f12', database='demomobile')
except mysql.connector.Error as err:
	if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
		print("Something is wrong with your user name or password")
	elif err.errno == errorcode.ER_BAD_DB_ERROR:
		print("Database does not exists")
	else:
		print(err)
		cnx.close()
		exit();
cursor = cnx.cursor()

server = MyTCPServer(('0.0.0.0', 80), MyTCPServerHandler)
server.serve_forever()
