'use client';
import React, { useState } from 'react';
import {
  Upload, Button, message, Spin, Typography, Divider, Space, Card, Alert
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const Uploads = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState(false);

  const props = {
    beforeUpload: (file) => {
      setFile(file);
      setUploadSuccess(false);
      setUploadError(false);
      return false;
    },
    showUploadList: false,
  };

  const handleUpload = async () => {
    if (!file) {
      message.warning('Por favor selecciona un archivo');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);

      const response = await fetch('http://localhost:5005/api/v1/cuipo/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al subir el archivo');
      }

      const result = await response.json();
      console.log(result);

      setUploadSuccess(true);
      setUploadError(false);
    } catch (error) {
      console.error(error);
      setUploadError(true);
      setUploadSuccess(false);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: '40px 80px' }}>
      <Card>
        <Title level={3}>Subida de Archivos</Title>
        <Divider />

        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Upload {...props}>
            <Button icon={<UploadOutlined />}>Seleccionar Archivo Excel</Button>
          </Upload>

          {file && (
            <Text type="secondary">
              Archivo seleccionado: <strong>{file.name}</strong>
            </Text>
          )}

          <Button
            type="primary"
            onClick={handleUpload}
            disabled={!file}
            loading={uploading}
          >
            Cargar Archivo
          </Button>

          {uploading && (
            <Spin tip="Subiendo archivo...">
              <div style={{ height: 60 }} />
            </Spin>
          )}

          {uploadSuccess && (
            <Alert
              message="Éxito"
              description="Archivo subido exitosamente."
              type="success"
              showIcon
              closable
            />
          )}

          {uploadError && (
            <Alert
              message="Error"
              description="Ocurrió un error al subir el archivo."
              type="error"
              showIcon
              closable
            />
          )}
        </Space>
      </Card>
    </div>
  );
};

export default Uploads;
