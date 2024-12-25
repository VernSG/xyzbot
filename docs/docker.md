# Build image local

```
docker build -t xyzbot .
```

# Cek images yang telah di build

```
docker images
```

# Push docker images ke repository

add tag

```
sudo docker tag xyzbot:latest vernsg/xyzbot:latest
```

buat repo

```
https://hub.docker.com/repositories/
```

push ke docker

```
sudo docker push vernsg/xyzbot:latest
```

# Pull docker di vps atau yg lain

```
sudo docker pull vernsg/xyzbot:latest
```

# Jalankan container dengan image yang telah dibangun

```
        sudo docker run -d \
        --name xyzbot \
        -v $(pwd)/sessions:/app/sessions \
        vernsg/xyzbot:latest
```

# Periksa apakah container berjalan

```
docker ps
```

# Check logs

```
docker logs -f xyzbot
```

# Stop docker

```
sudo docker stop xyzbot
```

# Start docker jika sudah ada container

```
sudo docker start xyzbot
```

# Delete images

```
sudo docker rmi xyzbot
```

# Hapus container yang lagi berjalan

```
sudo docker rm xyzbot (nama container)
```
