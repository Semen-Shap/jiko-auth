cd backend
mkdir -p tmp
CompileDaemon -build="go build -o ./tmp/main.exe ./cmd" -command="./tmp/main.exe" -directory="." -exclude="*_test.go"