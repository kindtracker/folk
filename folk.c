#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <netdb.h>
#include <errno.h>

typedef struct {
  const char *name;
  float x;
  float y;
  float z;
  int id;
} player_t;

player_t *login(int sock, struct sockaddr_in addr, const char *token) {
  int msg_len = 12 + 64;
  char *msg = (char *)malloc(msg_len);
  memset(msg, 0, msg_len);
  int type = 6;
  memcpy(msg, &type, 4);
  int c = 0x40;
  memcpy(msg + 4, &c, 4);
  memcpy(msg + 12, token, 64);

  printf("[folk] sending to %s:%d\n", inet_ntoa(addr.sin_addr), ntohs(addr.sin_port));
  printf("[folk] sending login packet (%d bytes)\n", msg_len);
  if (sendto(sock, msg, msg_len, 0, (struct sockaddr *)&addr, sizeof(addr)) < 0) {
    printf("[folk] something goes wrong\n");
    perror("sendto");
    free(msg);
    return NULL;
  }
  printf("[folk] sent\n");

  player_t *player = (player_t *)malloc(sizeof(player_t));
  char buffer[4096];
  socklen_t addr_len = sizeof(struct sockaddr_in);
 
  int t = 10000;
  while (t > 0) {
    t--;
    int bytes = recvfrom(sock, buffer, sizeof(buffer) - 1, 0, (struct sockaddr *)&addr, &addr_len);
    printf("[folk] recvfrom returned: %d (errno: %d)\n", bytes, errno);
    if (bytes < 0) {
      printf("[folk] something goes wrong\n");
      perror("recvfrom");
      return NULL;
    }
    
    int pkt_type = buffer[0];
    printf("[folk] received %d bytes, type: 0x%02x\n", bytes, pkt_type);
    if (pkt_type == 0x12) {
      printf("[folk] auth: waiting\n");
      char state[103];
      memset(state, 0, sizeof(state));
  
      int type = 0;
      memcpy(state, &type, 4);
  
      uint64_t name_len = 11;  // "kindtracker"
      memcpy(state + 20, &name_len, 8);
      memcpy(state + 28, "kindtracker", 11);
  
      float x = 0.0, y = 325.6, z = 0.0;
      memcpy(state + 40, &x, 4);
      memcpy(state + 44, &y, 4);
      memcpy(state + 48, &z, 4);
  
      float yaw = 0.0;
      memcpy(state + 52, &yaw, 4);
  
      state[56] = 0;
      state[57] = 1;
  
      if (sendto(sock, state, sizeof(state), 0, (struct sockaddr *)&addr, sizeof(addr)) < 0) {
        printf("[folk] something goes wrong\n");
        perror("sendto state");
        return NULL;
      }
    } else if (pkt_type == 0x11) {
      uint64_t name_len;
      memcpy(&name_len, buffer + 28, 8);
      char *name = (char *)malloc(name_len + 1);
      memcpy(name, buffer + 36, name_len);
      name[name_len] = '\0';
      player->name = strdup(name);
      free(name);
      printf("[folk] auth: successfully\n");
      free(msg);
      break;
    }
  }
  
  return player;
}

int main(int argc, char *argv[]) {
  if (argc != 2) {
    printf("Usage: folk [TOKEN]\n");
    return 1;
  }
  const char *token = argv[1];
  if (strlen(token) != 64) {
    printf("token needs to be 64 bytes wide (size: %d)\n", strlen(token));
    return 1;
  }

  struct addrinfo hints, *result;
  memset(&hints, 0, sizeof(hints));
  hints.ai_family = AF_INET;
  hints.ai_socktype = SOCK_DGRAM;

  int status = getaddrinfo("connect.playvortex.io", "7777", &hints, &result);
  if (status != 0) {
    fprintf(stderr, "getaddrinfo: %s\n", gai_strerror(status));
    return 1;
  }

  int sock = socket(AF_INET, SOCK_DGRAM, 0);
  if (sock < 0) {
    perror("socket");
    return 1;
  }
  struct timeval tv;
  tv.tv_sec = 10;
  tv.tv_usec = 0;
  if (setsockopt(sock, SOL_SOCKET, SO_RCVTIMEO, &tv, sizeof(tv)) < 0) {
    perror("setsockopt");
  }
  
  struct sockaddr_in server_addr;
  memset(&server_addr, 0, sizeof(server_addr));
  server_addr.sin_family = AF_INET;
  server_addr.sin_port = htons(7777);

  printf("[folk] connecting to the server\n");
  struct sockaddr_in *resolved = (struct sockaddr_in *)result->ai_addr;
  server_addr.sin_addr = resolved->sin_addr;

  struct sockaddr_in *raddr = (struct sockaddr_in *)result->ai_addr;
  printf("[folk] resolved IP: %s\n", inet_ntoa(resolved->sin_addr));
  printf("[folk] port: %d\n", ntohs(resolved->sin_port));
  
  player_t *player = login(sock, *resolved, token);
  printf("[folk] player: %p\n", player);
  if (player) {
    printf("[folk] name: %s\n", player->name);
  }
/*  while (true) {
    const char *message = "Hello from UDP client";
    if (sendto(sock, message, strlen(message), 0, (struct sockaddr *)&server_addr, sizeof(server_addr)) < 0) {
      perror("sendto");
      close(sock);
      return 1;
    }

    char buffer[1024];
    struct sockaddr_in client_addr;
    socklen_t addr_len = sizeof(client_addr);

    int n = recvfrom(sock, buffer, sizeof(buffer) - 1, 0, (struct sockaddr *)&client_addr, &addr_len);
    if (n < 0) {
      perror("recvfrom");
      close(sock);
      return 1;
    }

    buffer[n] = '\0';
    printf("received: %s\n", buffer);
  }*/

  freeaddrinfo(result);
  close(sock);
  return 0;
}
