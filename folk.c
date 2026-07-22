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

player_t *login(int sock, const char *token) {
  int msg_len = 12 + 64;
  char *msg = (char *)malloc(msg_len);
  memset(msg, 0, sizeof(msg));
  msg[0] = 0x06;
  msg[4] = 0x40;
  memcpy(msg + 12, token, 64);

  printf("[folk] sending login packet (%d bytes)\n", msg_len);
  if (send(sock, msg, msg_len, 0) < 0) {
    printf("[folk] something goes wrong\n");
    perror("send");
    free(msg);
    return NULL;
  }
  printf("[folk] sent\n");

  player_t *player = (player_t *)malloc(sizeof(player_t));
  memset(player, 0, sizeof(player_t));
  char buffer[4096];
  
  while (1) {
    int bytes = recv(sock, buffer, sizeof(buffer) - 1, 0);
    printf("[folk] recv returned: %d (errno: %d)\n", bytes, errno);
    
    if (bytes < 0) {
      if (errno == EAGAIN || errno == EWOULDBLOCK) {
        printf("[folk] timeout waiting for response\n");
      } else {
        printf("[folk] something goes wrong\n");
        perror("recv");
      }
      free(player);
      free(msg);
      return NULL;
    }
    
    if (bytes < 1) continue;
    
    int pkt_type = buffer[0];
    printf("[folk] received %d bytes, type: 0x%02x\n", bytes, pkt_type);
    
    if (pkt_type == 0x12) {
      printf("[folk] auth: waiting (0x12 received)\n");
      char state[103];
      memset(state, 0, sizeof(state));
  
      int type = 0;
      memcpy(state, &type, 4);
  
      uint64_t name_len = 11;
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
  
      if (send(sock, state, sizeof(state), 0) < 0) {
        printf("[folk] state send failed\n");
        perror("send state");
        free(player);
        free(msg);
        return NULL;
      }
      printf("[folk] state sent\n");
      
    } else if (pkt_type == 0x11) {
      uint64_t name_len;
      memcpy(&name_len, buffer + 28, 8);
      
      char *name = (char *)malloc(name_len + 1);
      memcpy(name, buffer + 36, name_len);
      name[name_len] = '\0';
      player->name = strdup(name);
      free(name);
      
      memcpy(&player->x, buffer + 40, 4);
      memcpy(&player->y, buffer + 44, 4);
      memcpy(&player->z, buffer + 48, 4);
      memcpy(&player->id, buffer + 52, 4);
      
      printf("[folk] auth: successful\n");
      free(msg);
      break;
    }
  }
  
  return player;
}

in_addr_t resolvedomain(char *domain) {
  struct addrinfo hints;
  struct addrinfo *result;
  int status;

  memset(&hints, 0, sizeof(hints));
  hints.ai_family = AF_INET;
  hints.ai_socktype = SOCK_DGRAM;

  status = getaddrinfo(domain, "80", &hints, &result);
  if (status != 0) {
    fprintf(stderr, "getaddrinfo: %s\n", gai_strerror(status));
    return INADDR_NONE;
  }

  struct sockaddr_in *ipv4 = (struct sockaddr_in *)result->ai_addr;
  in_addr_t addr = ipv4->sin_addr.s_addr;

  freeaddrinfo(result);
  return addr;
}

int main(int argc, char *argv[]) {
  if (argc != 2) {
    printf("Usage: folk [TOKEN]\n");
    return 1;
  }
  const char *token = argv[1];
  if (strlen(token) != 64) {
    printf("token needs to be 64 bytes wide (size: %d)\n", (int)strlen(token));
    return 1;
  }

  int sock = socket(AF_INET, SOCK_DGRAM, 0);
  struct sockaddr_in serv_addr;
  if (sock < 0) {
    printf("[folk] something goes wrong\n");
    perror("socket");
    return 1;
  }
  
  struct timeval tv;
  tv.tv_sec = 10;
  tv.tv_usec = 0;
  if (setsockopt(sock, SOL_SOCKET, SO_RCVTIMEO, &tv, sizeof(tv)) < 0) {
    printf("[folk] something goes wrong\n");
    perror("setsockopt");
    return 1;
  }
  
  bzero(&serv_addr, sizeof(serv_addr));
  serv_addr.sin_family = AF_INET;
  serv_addr.sin_port = htons(7777);
  serv_addr.sin_addr.s_addr = resolvedomain("connect.playvortex.io");

  printf("[folk] connecting to server\n");
  if (connect(sock, (struct sockaddr *)&serv_addr, sizeof(serv_addr)) < 0) {
    printf("[folk] something goes wrong\n");
    perror("connect");
    return 1;
  }
  printf("[folk] connected\n");
  
  player_t *player = login(sock, token);
  printf("[folk] player: %p\n", player);
  if (player) {
    printf("[folk] name: %s\n", player->name);
    printf("[folk] position: (%.1f, %.1f, %.1f)\n", player->x, player->y, player->z);
  }

  close(sock);
  return 0;
}
