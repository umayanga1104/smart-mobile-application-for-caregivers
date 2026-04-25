build:
	docker build -t ai-service .

run:
	docker run -p 8000:8000 --env-file .env ai-service

stop:
	docker stop $(docker ps -q)

logs:
	docker logs $(docker ps -q)