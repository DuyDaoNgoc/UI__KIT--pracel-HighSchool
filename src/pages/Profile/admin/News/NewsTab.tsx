// src/pages/Profile/admin/NewsTab.tsx
import React from "react";
import { INews } from "../../../../types/news";

interface Props {
  pendingNews: INews[];
}

export default function NewsTab({ pendingNews }: Props) {
  return (
    <div className="profile__card">
      <h2>Tin tức chờ duyệt</h2>
      {pendingNews.length > 0 ? (
        <table className="profile__table">
          <thead>
            <tr>
              <th>Tiêu đề</th>
              <th>Tác giả</th>
              <th>Ngày tạo</th>
            </tr>
          </thead>
          <tbody>
            {pendingNews.map((news) =>
              news.id ? (
                <tr key={news.id}>
                  <td>{news.title}</td>
                  <td>{news.author || "N/A"}</td>
                  <td>
                    {news.createdAt
                      ? new Date(news.createdAt).toLocaleDateString()
                      : "N/A"}
                  </td>
                </tr>
              ) : null
            )}
          </tbody>
        </table>
      ) : (
        <p>Không có tin tức nào chờ duyệt.</p>
      )}
    </div>
  );
}
