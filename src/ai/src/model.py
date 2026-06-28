import torch
import torch.nn as nn
import torch.nn.functional as F

class ChessNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv1 = nn.Conv2d(12, 64, 3, padding=1)
        self.conv2 = nn.Conv2d(64, 64, 3, padding=1)
        self.conv3 = nn.Conv2d(64, 64, 3, padding=1)

        self.policy = nn.Linear(64 * 8 * 8, 4096)
        self.value  = nn.Linear(64 * 8 * 8, 1)

    def forward(self, x):
        x = F.relu(self.conv1(x))
        x = F.relu(self.conv2(x))
        x = F.relu(self.conv3(x))

        x = x.view(x.size(0), -1)

        policy = self.policy(x)
        value  = torch.tanh(self.value(x))

        return policy, value

if __name__ == "__main__":
    model = ChessNet()
    x = torch.zeros(1, 12, 8, 8)  # une position vide
    policy, value = model(x)
    print("Policy shape :", policy.shape)  # doit afficher (1, 4096)
    print("Value shape  :", value.shape)   # doit afficher (1, 1)
    print("Value        :", value.item())  # un nombre entre -1 et 1