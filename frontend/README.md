# ĐẦM SEN PATHFINDING APP

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)

---

## Giới thiệu

**Đầm Sen Pathfinding App** là một ứng dụng web trực quan giúp người dùng tìm đường đi ngắn nhất giữa hai điểm trong công viên Đầm Sen.  
Ứng dụng kết hợp giao diện trực quan (canvas tương tác) với các thuật toán tìm đường tối ưu (A*, Dijkstra).  

Dự án gồm hai phần:
- **Frontend**: HTML/CSS/JS, sử dụng Canvas API để hiển thị bản đồ, node, edge và highlight đường đi.
- **Backend**: Node.js (Express) cung cấp API `/api/graph`, quản lý dữ liệu graph (nodes, edges) từ file `graph.json`.

---

## Thành viên nhóm

- **Lê Việt Hải Quân** - [Email](mailto:leviethaiquan2206@gmail.com) - [Github](https://github.com/QiQi-IS-A-DEV)

---

## Công nghệ sử dụng

### Frontend
- **HTML5, CSS3** (Dark/Light theme bằng CSS variables)
- **JavaScript (ES6+)**
  - Canvas API
  - Event handling (click, pan, zoom, chọn A/B)
  - Breadcrumb lộ trình & danh sách step
  - Badge số thứ tự trực tiếp trên bản đồ

### Backend
- **Node.js 18+**
- **Express.js**
- **Graph JSON** (tùy chỉnh node/edge)
- REST API `/api/graph`

### Thuật toán
- **Dijkstra** (độ chính xác tuyệt đối với đồ thị trọng số dương)
- **A\*** (tối ưu hơn nhờ heuristic Euclidean)

---

## Tính năng nổi bật

- Chọn 2 điểm trên bản đồ → hiển thị đường đi ngắn nhất.
- Hỗ trợ **A\*** và **Dijkstra**, có thể chọn trực tiếp.
- **Pan & Zoom** trên bản đồ.
- **Breadcrumb inline**: hiển thị nhanh các điểm trong lộ trình.
- **Danh sách chi tiết**: từng chặng + khoảng cách.
- **Step badges** hiển thị số thứ tự trực tiếp trên bản đồ.
- **Dark/Light mode** với lưu lại trạng thái (localStorage).
- Dữ liệu bản đồ dễ mở rộng qua `graph.json`.

---

## Cấu trúc dự án

```
dam-sen-pathfinding/
├── index.html # Giao diện chính
├── style.css # CSS (Dark/Light theme)
├── app.js # Logic frontend (canvas, UI)
├── graph.js # Định nghĩa Graph, load dữ liệu
├── algo.js # Thuật toán A* và Dijkstra
├── server.js # Backend Express.js
├── graph.json # Dữ liệu node/edge công viên
└── README.md # Tài liệu (file này)
```

---

## Hướng dẫn cài đặt & chạy thử

### Backend (Node.js + Express)

1. **Clone dự án:**
    ```bash
    git clone https://github.com/QiQi-IS-A-DEV/DamSen-Pathfinding.git
    cd DamSen-Pathfinding
    ```

2. **Cài đặt dependencies:**
    ```bash
    npm install
    ```

3. **Chạy server:**
    ```bash
    node server.js
    ```
    Mặc định API chạy tại: [http://localhost:5173/api/graph](http://localhost:5173/api/graph)

---

### Frontend (HTML/JS)

1. Mở file `index.html` trong trình duyệt  
   *(hoặc dùng Live Server trong VSCode để chạy trên localhost)*

2. Chọn 2 điểm A/B trên bản đồ → đường đi sẽ tự động hiển thị.

---

## Tài liệu chi tiết

- [Chi tiết Backend (Express)](/server.js)
- [Chi tiết Frontend (Canvas/JS)](/app.js)

---

## Giấy phép

MIT License  

© 2025 Dam Sen Pathfinding Project. All rights reserved.
